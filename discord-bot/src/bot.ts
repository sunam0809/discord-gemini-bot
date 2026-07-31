import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";
import { askAI, type ChatMessage } from "./ai.js";
import { registerCommands } from "./commands.js";

// 채널별 대화 기록 (채널ID → 메시지 히스토리)
const chatHistory = new Map<string, ChatMessage[]>();

// 봇이 응답하는 채널 ID
let activeChannelId: string | null = null;

// 최대 히스토리: 8쌍 = 16개 메시지
const MAX_HISTORY = 16;

// 커맨드 프리픽스
const PREFIX = "!대화";

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const clientId = process.env["DISCORD_CLIENT_ID"];

  if (!token) throw new Error("DISCORD_BOT_TOKEN 환경변수가 없습니다.");
  if (!clientId) throw new Error("DISCORD_CLIENT_ID 환경변수가 없습니다.");

  await registerCommands(token, clientId);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  // 슬래시 커맨드 허용 유저 ID
  const ALLOWED_USER_ID = "1531640611977957446";

  // ── 슬래시 커맨드 처리 ──────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction as ChatInputCommandInteraction;

    // 권한 체크
    if (cmd.user.id !== ALLOWED_USER_ID) {
      await cmd.reply({ content: "❌ 이 명령어를 사용할 권한이 없습니다.", ephemeral: true });
      return;
    }

    if (cmd.commandName === "대화시작") {
      const channelId = cmd.options.getString("채널아이디", true).trim();
      activeChannelId = channelId;
      chatHistory.set(channelId, []);
      await cmd.reply(
        `✅ <#${channelId}> 채널 설정 완료!\n` +
        `\`${PREFIX} 안녕하세요\` 처럼 앞에 **${PREFIX}** 를 붙여서 말을 걸어보세요.`,
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
      await cmd.reply(`🗑️ <#${activeChannelId}> 대화 기록을 초기화했습니다.`);
    }

    else if (cmd.commandName === "상태") {
      if (!activeChannelId) {
        await cmd.reply(
          `💤 대화 채널이 설정되어 있지 않아요.\n` +
          "`/대화시작` 커맨드로 채널을 지정해주세요.",
        );
      } else {
        const histLen = chatHistory.get(activeChannelId)?.length ?? 0;
        await cmd.reply(
          `📡 대화 채널: <#${activeChannelId}>\n` +
          `💬 기억 중인 대화: ${Math.floor(histLen / 2)} / 8 쌍\n` +
          `💡 사용법: \`${PREFIX} 안녕하세요\``,
        );
      }
    }
  });

  // ── 메시지 처리 ────────────────────────────────────────────
  client.on(Events.MessageCreate, async (message: Message) => {
    // 봇 메시지 무시
    if (message.author.bot) return;
    // !대화 프리픽스 확인
    if (!message.content.startsWith(PREFIX)) return;
    // 지정된 채널에서만 작동
    if (!activeChannelId || message.channelId !== activeChannelId) return;

    // 프리픽스 이후 내용 추출
    const userInput = message.content.slice(PREFIX.length).trim();
    if (!userInput) {
      await message.reply(`❓ 내용을 입력해 주세요. 예시: \`${PREFIX} 안녕하세요\``);
      return;
    }

    // 타이핑 표시
    if ("sendTyping" in message.channel) {
      await message.channel.sendTyping();
    }

    const historyKey = message.channelId;
    const history = chatHistory.get(historyKey) ?? [];

    try {
      const reply = await askAI(history, userInput);

      // 히스토리 업데이트 (8쌍 = 16개 제한)
      history.push({ role: "user", text: userInput });
      history.push({ role: "assistant", text: reply });
      while (history.length > MAX_HISTORY) history.splice(0, 2);
      chatHistory.set(historyKey, history);

      // Discord 2000자 제한 처리
      if (reply.length <= 2000) {
        await message.reply(reply);
      } else {
        const chunks = reply.match(/[\s\S]{1,2000}/g) ?? [];
        for (const chunk of chunks) {
          const ch = message.channel;
          if ("send" in ch && typeof ch.send === "function") {
            await (ch.send as (c: string) => Promise<unknown>)(chunk);
          }
        }
      }
    } catch (err) {
      console.error("AI 응답 오류:", err);
      await message.reply("❌ 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`🤖 봇 로그인 완료: ${c.user.tag}`);
    console.log(`📌 사용법: ${PREFIX} [내용]`);
  });

  await client.login(token);
}
