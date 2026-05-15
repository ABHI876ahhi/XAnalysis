import Interview from "../models/interview.model.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// ─── Helper: extract clean error from axios responses ─────────────────────────
const extractAxiosError = (err) => {
    const data = err?.response?.data;
    if (data) {
        const msg = data?.error?.message || data?.message || JSON.stringify(data);
        return { msg, status: err.response.status };
    }
    return { msg: err.message || "Unknown error", status: null };
};

// ─── Diagnostic endpoint  GET /api/ai/test ────────────────────────────────────
export const testAI = async (req, res) => {
    const gKey  = process.env.GEMINI_API_KEY;
    const orKey = process.env.OPENROUTER_API_KEY;
    return res.status(200).json({
        gemini:     gKey  ? `SET (${gKey.slice(0, 10)}...)`  : "NOT SET",
        openrouter: orKey ? `SET (${orKey.slice(0, 12)}...)` : "NOT SET",
    });
};

// ─── Provider 1: Gemini (primary — free, generous quota) ──────────────────────
const callGemini = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
    });

    const formattedHistory = [];
    if (history && history.length > 0) {
        const mapped = history.map(m => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.text }],
        }));
        let startIndex = 0;
        while (startIndex < mapped.length && mapped[startIndex].role !== "user") startIndex++;
        let lastRole = null;
        for (let i = startIndex; i < mapped.length; i++) {
            if (mapped[i].role !== lastRole) {
                formattedHistory.push(mapped[i]);
                lastRole = mapped[i].role;
            }
        }
    }

    try {
        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text();
        if (!reply) throw new Error("Empty response from Gemini");
        return reply;
    } catch (err) {
        const detail = err?.message || "Unknown Gemini error";
        console.error(`[Gemini] Error: ${detail}`);
        throw new Error(`Gemini: ${detail}`);
    }
};

// ─── Provider 2: OpenRouter (fallback — expanded list of free models) ──────────
const OPENROUTER_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-3-12b-it:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "nousresearch/hermes-3-llama-3.1-8b:free",
];

const callOpenRouter = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
        })),
        { role: "user", content: userMessage },
    ];

    let lastError = null;
    for (const orModel of OPENROUTER_MODELS) {
        try {
            console.log(`[OpenRouter] Trying: ${orModel}`);
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                { model: orModel, messages, max_tokens: 1024 },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "HTTP-Referer": "https://xanalysis.onrender.com",
                        "X-Title": "XAnalysis AI Coach",
                        "Content-Type": "application/json",
                    },
                    timeout: 30000,
                }
            );
            const reply = response.data?.choices?.[0]?.message?.content;
            if (!reply) throw new Error(`Empty response from ${orModel}`);
            console.log(`[OpenRouter] Success with: ${orModel}`);
            return reply;
        } catch (err) {
            const { msg, status } = extractAxiosError(err);
            console.warn(`[OpenRouter] ${orModel} failed — ${status}: ${msg}`);
            lastError = new Error(`OpenRouter/${orModel}(${status}): ${msg}`);
            // Try next model if rate-limited, overloaded, or payment required for this model
            if (status === 429 || status === 503 || status === 402 || status === 403) continue;
            break;
        }
    }
    throw lastError || new Error("All OpenRouter models failed");
};

// ─── Build system prompt ───────────────────────────────────────────────────────
const buildSystemPrompt = async (interviewId, userId) => {
    let prompt =
        "You are an AI Interview Coach for XAnalysis. Help the user improve their interview skills. " +
        "Keep answers concise, practical, and directly relevant to interviews and professional development. " +
        "Format your responses clearly — use bullet points and short paragraphs where helpful.";

    if (interviewId) {
        const interview = await Interview.findOne({ _id: interviewId, userId });
        if (interview) {
            const summaries = interview.questions
                .map((q, i) =>
                    `Q${i + 1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10\nFeedback: ${q.feedback}`
                )
                .join("\n\n");
            prompt +=
                `\n\nThe user just completed an interview for the role of ${interview.role} (${interview.experience}).` +
                `\nFinal Score: ${interview.finalScore}/10\n\nQuestions & Answers:\n${summaries}` +
                `\n\nUse this context to provide highly personalized coaching.`;
        }
    }
    return prompt;
};

// ─── Main chat handler  POST /api/ai/chat ─────────────────────────────────────
export const chatWithAI = async (req, res) => {
    try {
        const { interviewId, message, conversationHistory } = req.body;
        const userId = req.userId;

        if (!message?.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const systemPrompt = await buildSystemPrompt(interviewId, userId);
        const history = conversationHistory || [];
        let reply, usedProvider;

        // ── 1. Try Gemini (primary) ──────────────────────────────────────────
        try {
            reply = await callGemini(systemPrompt, history, message);
            usedProvider = "gemini";
        } catch (gErr) {
            console.warn("[AI] Gemini failed:", gErr.message);

            // ── 2. Fallback to OpenRouter ────────────────────────────────────
            try {
                reply = await callOpenRouter(systemPrompt, history, message);
                usedProvider = "openrouter";
            } catch (orErr) {
                console.error("[AI] Both providers failed.");
                
                const gMsg = gErr.message.toLowerCase();
                const orMsg = orErr.message.toLowerCase();

                const isKey = gMsg.includes("api key") || orMsg.includes("api key") || gMsg.includes("401") || orMsg.includes("401");
                
                if (isKey) {
                    return res.status(500).json({
                        reply: "❌ AI API key is invalid or not set. Please check your Render environment variables.",
                    });
                }

                // If we get here, it's either quota or a safety filter/internal error
                // We'll show a more helpful message including the actual error if possible
                return res.status(429).json({
                    reply: `⚠️ AI service is currently busy or quota exceeded. Please try again in a moment. (Debug: ${gErr.message.slice(0, 50)})`,
                });
            }
        }

        console.log(`[AI] Reply via [${usedProvider}]`);
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("[AI] Unexpected error:", error);
        return res.status(500).json({ reply: `❌ Server error: ${error.message}` });
    }
};
