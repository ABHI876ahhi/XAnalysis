import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { chatWithAI, testAI } from "../controllers/ai.controller.js";

const aiRouter = express.Router();

// Public diagnostic endpoint — verify Gemini API key is working on the server
aiRouter.get("/test", testAI);
aiRouter.post("/chat", isAuth, chatWithAI);

export default aiRouter;
