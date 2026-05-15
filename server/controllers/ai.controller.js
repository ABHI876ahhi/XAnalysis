import Interview from "../models/interview.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Quick diagnostic — no auth needed. Hit GET /api/ai/test to verify the key on Render.
export const testAI = async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
        return res.status(500).json({ ok: false, error: "GEMINI_API_KEY is NOT set on this server." });
    }
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Reply with exactly: OK");
        return res.status(200).json({ ok: true, reply: result.response.text().trim(), keyPrefix: apiKey.slice(0, 10) + "..." });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
};

export const chatWithAI = async (req, res) => {
    try {
        const { interviewId, message, conversationHistory } = req.body;
        const userId = req.userId;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        let contextText = "You are an AI Interview Coach for XAnalysis. Your goal is to help the user improve their interview skills. Keep your answers concise, practical, and directly address their questions. IMPORTANT: You must ONLY give suggestions and coaching related to this app, interviews, and professional development.";

        if (interviewId) {
            const interview = await Interview.findOne({ _id: interviewId, userId });
            if (interview) {
                const questionsSummaries = interview.questions.map((q, i) => 
                    `Q${i+1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10\nFeedback: ${q.feedback}`
                ).join("\n\n");

                contextText += `\n\nThe user just completed an interview for the role of ${interview.role} (${interview.experience}).\nHere is their performance summary:\nFinal Score: ${interview.finalScore}/10\n\nQuestions and Answers:\n${questionsSummaries}\n\nUse this context to provide highly personalized Strength/Weakness analysis and coaching tips.`;
            }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
            return res.status(400).json({ reply: "API Key is missing or invalid. Please check your server/.env file." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: contextText
        });

        const formattedHistory = [];

        if (conversationHistory && conversationHistory.length > 0) {
            // Map roles: 'ai' → 'model', everything else → 'user'
            const mapped = conversationHistory.map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            // Gemini REQUIRES the first history message to be role 'user'.
            // Drop any leading 'model' messages to satisfy this constraint.
            let startIndex = 0;
            while (startIndex < mapped.length && mapped[startIndex].role !== 'user') {
                startIndex++;
            }

            // Also enforce strict alternation: skip consecutive same-role messages
            let lastRole = null;
            for (let i = startIndex; i < mapped.length; i++) {
                if (mapped[i].role !== lastRole) {
                    formattedHistory.push(mapped[i]);
                    lastRole = mapped[i].role;
                }
            }
        }

        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        res.status(200).json({ reply });

    } catch (error) {
        console.error("Error in AI Chat:", error);
        const errMsg = error?.message || "Unknown error";
        // Surface specific API errors so the frontend can show them
        if (errMsg.includes("API_KEY") || errMsg.includes("API key")) {
            return res.status(500).json({ reply: "❌ Gemini API key is invalid or missing on the server. Please check Render environment variables." });
        }
        if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            return res.status(500).json({ reply: "⚠️ Gemini API quota exceeded. Please try again later." });
        }
        res.status(500).json({ reply: `❌ AI service error: ${errMsg}` });
    }
};
