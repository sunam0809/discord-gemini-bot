import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";
import { askGemini, type ChatMessage } from "./gemini.js";
import { registerCommands } from "./commands.js";

// 채널별 대화 기록 (채널ID → 메시지 히스토리)
const chatHistory = new Map<string, ChatMessage[]>();

// 봇이 응답하는 채널 ID (하나만)
let activeChannelId: string | null = null;

// 최대 히스토리 길이 (토큰 절약)
const MAX_HISTORY = 20;

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const clientId = process.env["DISCORD_CLIENT_ID"];

  if (!token) throw new Error("DISCORD_BOT_TOKEN 환경변수가 없습니다.");
  if (!clientId) throw new Error("DISCORD_CLIENT_ID 환경변수가 없습니다.");

  // 슬래시 커맨드 등록
  await registerCommands(token, clientId);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  // ── 슬래시 커맨드 처리 ──────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction as ChatInputCommandInteraction;

    if (cmd.commandName === "대화시작") {
      const channelId = cmd.options.getString("채널아이디", true).trim();
      activeChannelId = channelId;
      chatHistory.set(channelId, []);
      await cmd.reply(
        `✅ <#${channelId}> 채널에서 Gemini와 대화를 시작합니다!\n` +
        `해당 채널에서 메시지를 보내면 봇이 응답해요.`,
      );
    }

    else if (cmd.commandName === "대화중지") {
      if (!activeChannelId) {
        await cmd.reply("⚠️ 현재 설정된 대화 채널이 없어요.");
        return;
      }
      const prev = activeChannelId;
      activeChannelId = null;
      await cmd.reply(`🔇 <#${prev}> 채널의 대화를 중지했습니다.`);
    }

    else if (cmd.commandName === "대화초기화") {
      if (!activeChannelId) {
        await cmd.reply("⚠️ 현재 설정된 대화 채널이 없어요.");
        return;
      }
      chatHistory.set(activeChannelId, []);
      await cmd.reply(`🗑️ <#${activeChannelId}> 채널의 대화 기록을 초기화했습니다.`);
    }

    else if (cmd.commandName === "상태") {
      if (!activeChannelId) {
        await cmd.reply("💤 현재 대화 채널이 설정되어 있지 않아요.\n`/대화시작` 커맨드로 채널을 지정해주세요.");
      } else {
        const histLen = chatHistory.get(activeChannelId)?.length ?? 0;
        await cmd.reply(
          `📡 현재 대화 채널: <#${activeChannelId}>\n` +
          `💬 누적 대화 수: ${Math.floor(histLen / 2)}개`,
        );
      }
    }
  });

  // ── 메시지 처리 ────────────────────────────────────────────
  client.on(Events.MessageCreate, async (message: Message) => {
    // 봇 메시지 무시
    if (message.author.bot) return;
    // 설정된 채널이 아니면 무시
    if (!activeChannelId || message.channelId !== activeChannelId) return;
    // 빈 메시지 무시
    const content = message.content.trim();
    if (!content) return;

    // 타이핑 표시
    if ("sendTyping" in message.channel) {
      await message.channel.sendTyping();
    }

    const history = chatHistory.get(activeChannelId) ?? [];

    try {
      const reply = await askGemini(history, content);

      // 히스토리 업데이트
      history.push({ role: "user", text: content });
      history.push({ role: "model", text: reply });

      // 히스토리 길이 제한
      while (history.length > MAX_HISTORY) history.splice(0, 2);
      chatHistory.set(activeChannelId, history);

      // Discord 메시지 최대 2000자 제한 처리
      if (reply.length <= 2000) {
        await message.reply(reply);
      } else {
        const chunks = reply.match(/[\s\S]{1,2000}/g) ?? [];
        const ch = message.channel;
        for (const chunk of chunks) {
          // PartialGroupDMChannel에는 send가 없으므로 타입 가드 사용
          if ("send" in ch && typeof ch.send === "function") {
            await (ch.send as (content: string) => Promise<unknown>)(chunk);
          }
        }
      }
    } catch (err) {
      console.error("Gemini 응답 오류:", err);
      await message.reply("❌ Gemini 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`🤖 봇 로그인 완료: ${c.user.tag}`);
  });

  await client.login(token);
}
