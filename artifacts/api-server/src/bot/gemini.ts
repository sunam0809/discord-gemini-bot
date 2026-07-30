import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";

const apiKey = process.env["GEMINI_API_KEY"];

if (!apiKey) {
  logger.warn("GEMINI_API_KEY is not set — Gemini responses will fail");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

export type ChatMessage = { role: "user" | "model"; text: string };

/**
 * Send a conversation history to Gemini and return the reply text.
 */
export async function askGemini(
  history: ChatMessage[],
  newMessage: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  });

  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}
