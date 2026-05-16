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

const compactUnique = (items) => [...new Set(items.filter(Boolean))];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = (promise, ms, label) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const isRetryableProviderError = (err) => {
    const status = err?.status || err?.response?.status;
    const msg = (err?.message || "").toLowerCase();

    return [408, 429, 500, 502, 503, 504].includes(status) ||
        msg.includes("fetch") ||
        msg.includes("timeout") ||
        msg.includes("temporarily") ||
        msg.includes("overload") ||
        msg.includes("quota") ||
        msg.includes("rate limit") ||
        msg.includes("resource_exhausted");
};

const isModelUnavailableError = (err) => {
    const status = err?.status || err?.response?.status;
    const msg = (err?.message || "").toLowerCase();

    return status === 404 ||
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("not available");
};

const formatGeminiHistory = (history) => {
    const formattedHistory = [];
    if (history && history.length > 0) {
        const mapped = history
            .filter(m => m?.text)
            .map(m => ({
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

    return formattedHistory;
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
const GEMINI_MODELS = compactUnique([
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]);

const buildGeminiContents = (history, userMessage) => {
    const contents = formatGeminiHistory(history);
    const last = contents[contents.length - 1];

    if (last?.role === "user") {
        last.parts.push({ text: userMessage });
    } else {
        contents.push({ role: "user", parts: [{ text: userMessage }] });
    }

    return contents;
};

const callGeminiRest = async (apiKey, modelName, systemPrompt, history, userMessage) => {
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
        {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: buildGeminiContents(history, userMessage),
        },
        {
            params: { key: apiKey },
            timeout: 30000,
        }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const reply = parts.map(part => part?.text || "").join("").trim();
    if (!reply) throw new Error(`Empty response from Gemini REST ${modelName}`);
    return reply;
};

const callGemini = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const formattedHistory = formatGeminiHistory(history);
    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
        });

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const chat = model.startChat({ history: formattedHistory });
                const result = await withTimeout(chat.sendMessage(userMessage), 30000, `Gemini ${modelName}`);
                const reply = result.response.text();
                if (!reply) throw new Error(`Empty response from Gemini ${modelName}`);
                return reply;
            } catch (err) {
                const detail = err?.message || "Unknown Gemini error";
                console.warn(`[Gemini] ${modelName} attempt ${attempt} failed: ${detail}`);
                lastError = err;

                if (isModelUnavailableError(err) || !isRetryableProviderError(err)) break;
                if (attempt < 2) await delay(700 * attempt);
            }
        }

        try {
            console.log(`[Gemini] Trying REST fallback: ${modelName}`);
            return await callGeminiRest(apiKey, modelName, systemPrompt, history, userMessage);
        } catch (err) {
            const { msg, status } = extractAxiosError(err);
            console.warn(`[Gemini] REST ${modelName} failed - ${status}: ${msg}`);
            lastError = new Error(`Gemini REST/${modelName}(${status}): ${msg}`);

            if (!isRetryableProviderError(err) && !isModelUnavailableError(err)) break;
        }
    }

    const detail = lastError?.message || "Unknown Gemini error";
    throw new Error(`Gemini: ${detail}`);
};

// ─── Provider 2: OpenRouter (fallback — expanded list of free models) ──────────
const OPENROUTER_FALLBACK_MODELS = [
    process.env.OPENROUTER_MODEL,
    "openai/gpt-4o-mini",
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-lite",
    "deepseek/deepseek-chat-v3-0324:free",
    "qwen/qwen3-235b-a22b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-3-12b-it:free",
    "nousresearch/hermes-3-llama-3.1-8b:free",
].filter(Boolean);

let openRouterModelCache = {
    expiresAt: 0,
    models: [],
};

const discoverOpenRouterModels = async (apiKey) => {
    if (openRouterModelCache.expiresAt > Date.now()) {
        return openRouterModelCache.models;
    }

    const response = await axios.get("https://openrouter.ai/api/v1/models", {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        timeout: 10000,
    });

    const discovered = (response.data?.data || [])
        .map(model => model?.id)
        .filter(id => typeof id === "string" && id.endsWith(":free"));

    openRouterModelCache = {
        expiresAt: Date.now() + (1000 * 60 * 30),
        models: discovered,
    };

    return discovered;
};

const getOpenRouterModels = async (apiKey) => {
    try {
        const discovered = await discoverOpenRouterModels(apiKey);
        const preferredFreeModels = discovered.filter(id =>
            /deepseek|qwen|llama|mistral|gemma|gemini/i.test(id)
        );

        return compactUnique([
            process.env.OPENROUTER_MODEL,
            ...preferredFreeModels,
            ...discovered,
            ...OPENROUTER_FALLBACK_MODELS,
        ]);
    } catch (err) {
        const { msg, status } = extractAxiosError(err);
        console.warn(`[OpenRouter] Model discovery failed - ${status}: ${msg}`);
        return compactUnique(OPENROUTER_FALLBACK_MODELS);
    }
};

const callOpenRouter = async (systemPrompt, history, userMessage) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
    const safeHistory = Array.isArray(history) ? history : [];

    const messages = [
        { role: "system", content: systemPrompt },
        ...safeHistory.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
        })),
        { role: "user", content: userMessage },
    ];

    let lastError = null;
    const openRouterModels = await getOpenRouterModels(apiKey);

    for (const orModel of openRouterModels) {
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
            lastError.status = status;
            // Try next model if rate-limited, overloaded, or payment required for this model
            if (status === 402 || status === 403 || isRetryableProviderError({ message: msg, status })) continue;
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
const buildLocalCoachingReply = async (interviewId, userId) => {
    if (!interviewId) return null;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview || !Array.isArray(interview.questions) || interview.questions.length === 0) return null;

    const scoredQuestions = interview.questions
        .map((q, index) => ({
            index: index + 1,
            question: q.question,
            answer: q.answer,
            score: Number(q.score || 0),
            feedback: q.feedback,
            confidence: Number(q.confidence || 0),
            communication: Number(q.communication || 0),
            correctness: Number(q.correctness || 0),
        }))
        .filter(q => q.answer || q.feedback || q.score > 0);

    if (scoredQuestions.length === 0) return null;

    const avg = (field) => scoredQuestions.reduce((sum, q) => sum + q[field], 0) / scoredQuestions.length;
    const finalScore = Number.isFinite(Number(interview.finalScore))
        ? Number(interview.finalScore)
        : avg("score");

    const best = [...scoredQuestions].sort((a, b) => b.score - a.score)[0];
    const weakest = [...scoredQuestions].sort((a, b) => a.score - b.score)[0];
    const areas = [
        { label: "confidence", value: avg("confidence") },
        { label: "communication", value: avg("communication") },
        { label: "correctness", value: avg("correctness") },
    ].sort((a, b) => a.value - b.value);

    const focusArea = areas[0]?.label || "communication";
    const strengthArea = areas[areas.length - 1]?.label || "clarity";

    return [
        "Here is a quick coaching snapshot from your saved interview data.",
        "",
        `Overall score: ${finalScore.toFixed(1)}/10`,
        "",
        "Strengths:",
        `- Your strongest area is ${strengthArea}.`,
        best?.feedback ? `- Best response signal: ${best.feedback}` : `- Best response was around question ${best?.index}.`,
        "",
        "Work on next:",
        `- Focus first on ${focusArea}.`,
        weakest?.feedback ? `- Lowest response signal: ${weakest.feedback}` : `- Revisit question ${weakest?.index} and add more structure.`,
        "",
        "Quick practice plan:",
        "- Answer in this order: situation, action, result, learning.",
        "- Keep each answer specific with one concrete example.",
        "- Do one more pass on the weakest answer and make it 20 percent shorter.",
    ].join("\n");
};

const buildGeneralCoachingReply = (message) => {
    const text = message.toLowerCase();

    if (text.includes("resume") || text.includes("cv")) {
        return [
            "Here is a quick resume coaching pass:",
            "",
            "- Put your strongest role, skills, and measurable achievements in the top third.",
            "- Rewrite each project bullet as: built what, using which tools, with what result.",
            "- Add numbers where possible: users, speed, accuracy, revenue, time saved, or scale.",
            "- Keep weak or unrelated details shorter so the best evidence stands out.",
            "",
            "A strong bullet format:",
            "Built [feature/project] using [tools], improving [metric/result] by [number].",
        ].join("\n");
    }

    if (text.includes("weakness") || text.includes("strength")) {
        return [
            "For strengths and weaknesses, keep it honest and job-focused.",
            "",
            "Strengths:",
            "- Choose one technical strength and one communication or ownership strength.",
            "- Prove each with a short example from a project, internship, or previous role.",
            "",
            "Weakness:",
            "- Pick a real but manageable weakness.",
            "- Explain what you are doing to improve it.",
            "- End with recent progress, not an apology.",
        ].join("\n");
    }

    if (text.includes("answer") || text.includes("question") || text.includes("interview")) {
        return [
            "Use this structure for a strong interview answer:",
            "",
            "- Direct answer: give the main point in one sentence.",
            "- Evidence: share one specific project, task, or situation.",
            "- Action: explain what you personally did.",
            "- Result: mention the outcome, metric, or learning.",
            "- Close: connect it back to the role.",
            "",
            "Keep it clear, practical, and under 90 seconds unless the interviewer asks for detail.",
        ].join("\n");
    }

    return [
        "I can help with that as your interview coach.",
        "",
        "- Start with the goal: what role or skill are you preparing for?",
        "- Share one specific question, answer, resume bullet, or situation.",
        "- I will help you make it clearer, more confident, and more interview-ready.",
        "",
        "For now, use this simple answer formula: point, example, action, result, learning.",
    ].join("\n");
};

export const chatWithAI = async (req, res) => {
    try {
        const { interviewId, message, conversationHistory } = req.body;
        const userId = req.userId;

        if (!message?.trim()) {
            return res.status(400).json({ message: "Message is required" });
        }

        const systemPrompt = await buildSystemPrompt(interviewId, userId);
        const history = Array.isArray(conversationHistory) ? conversationHistory : [];
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
                reply = await buildLocalCoachingReply(interviewId, userId) ||
                    buildGeneralCoachingReply(message);
                usedProvider = interviewId ? "local-report-fallback" : "local-coach-fallback";
            }
        }

        console.log(`[AI] Reply via [${usedProvider}]`);
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("[AI] Unexpected error:", error);
        return res.status(500).json({ reply: `❌ Server error: ${error.message}` });
    }
};
