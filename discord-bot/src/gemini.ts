import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env["GEMINI_API_KEY"];
if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");

const genAI = new GoogleGenerativeAI(apiKey);

export type ChatMessage = { role: "user" | "model"; text: string };

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
