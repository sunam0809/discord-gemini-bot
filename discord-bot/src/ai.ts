import Groq from "groq-sdk";

const apiKey = process.env["GROQ_API_KEY"];
if (!apiKey) throw new Error("GROQ_API_KEY 환경변수가 설정되지 않았습니다.");

const groq = new Groq({ apiKey });

export type ChatMessage = { role: "user" | "assistant"; text: string };

export async function askAI(
  history: ChatMessage[],
  newMessage: string,
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "당신은 친절하고 유능한 AI 어시스턴트입니다. 한국어로 자연스럽게 대화하세요.",
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    })),
    { role: "user", content: newMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 250,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "응답을 받지 못했습니다.";
}
