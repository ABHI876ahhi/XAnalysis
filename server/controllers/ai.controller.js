import Interview from "../models/interview.model.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// ─── Quick diagnostic — no auth needed ────────────────────────────────────────
// Hit GET /api/ai/test to verify keys are set on the server (e.g. on Render)
export const testAI = async (req, res) => {
    const orKey = process.env.OPENROUTER_API_KEY;
    const gKey  = process.env.GEMINI_API_KEY;
    return res.status(200).json({
        openrouter: orKey ? `SET (${orKey.slice(0, 12)}...)` : "NOT SET",
        gemini:     gKey  ? `SET (${gKey.slice(0, 10)}...)`  : "NOT SET",
    });
};

// ─── Primary: OpenRouter (free tier, many models) ─────────────────────────────
const callOpenRouter = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Build messages array: system + conversation history + latest user message
    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text
        })),
        { role: "user", content: userMessage }
    ];

    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "google/gemini-2.0-flash-exp:free", // free model on OpenRouter
            messages,
            max_tokens: 1024,
        },
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
    if (!reply) throw new Error("Empty response from OpenRouter");
    return reply;
};

// ─── Fallback: Direct Gemini SDK ──────────────────────────────────────────────
const callGemini = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
    });

    // Build formatted history for Gemini (must start with 'user', strict alternation)
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

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
};

// ─── Main chat handler ─────────────────────────────────────────────────────────
export const chatWithAI = async (req, res) => {
    try {
        const { interviewId, message, conversationHistory } = req.body;
        const userId = req.userId;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // Build system context
        let systemPrompt = "You are an AI Interview Coach for XAnalysis. Your goal is to help the user improve their interview skills. Keep your answers concise, practical, and directly address their questions. IMPORTANT: You must ONLY give suggestions and coaching related to this app, interviews, and professional development.";

        if (interviewId) {
            const interview = await Interview.findOne({ _id: interviewId, userId });
            if (interview) {
                const questionsSummaries = interview.questions.map((q, i) =>
                    `Q${i + 1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10\nFeedback: ${q.feedback}`
                ).join("\n\n");
                systemPrompt += `\n\nThe user just completed an interview for the role of ${interview.role} (${interview.experience}).\nHere is their performance summary:\nFinal Score: ${interview.finalScore}/10\n\nQuestions and Answers:\n${questionsSummaries}\n\nUse this context to provide highly personalized Strength/Weakness analysis and coaching tips.`;
            }
        }

        let reply;
        let usedProvider = "";

        // Try OpenRouter first (primary — has free tier)
        try {
            reply = await callOpenRouter(systemPrompt, conversationHistory || [], message);
            usedProvider = "openrouter";
        } catch (orErr) {
            console.warn("OpenRouter failed, falling back to Gemini:", orErr.message);

            // Fallback to direct Gemini
            try {
                reply = await callGemini(systemPrompt, conversationHistory || [], message);
                usedProvider = "gemini";
            } catch (gemErr) {
                console.error("Both providers failed:", gemErr.message);

                const msg = gemErr.message || "";
                if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                    return res.status(429).json({ reply: "⚠️ AI quota exceeded on all providers. Please try again later or contact support." });
                }
                if (msg.includes("API_KEY") || msg.includes("API key")) {
                    return res.status(500).json({ reply: "❌ AI API key is invalid or missing. Please check Render environment variables." });
                }
                return res.status(500).json({ reply: `❌ AI service error: ${msg}` });
            }
        }

        console.log(`AI reply via [${usedProvider}]`);
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("Unexpected error in chatWithAI:", error);
        return res.status(500).json({ reply: `❌ Unexpected server error: ${error.message}` });
    }
};
