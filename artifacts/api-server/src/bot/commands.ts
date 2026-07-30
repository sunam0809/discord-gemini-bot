import {
  REST,
  Routes,
  SlashCommandBuilder,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { logger } from "../lib/logger";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder()
    .setName("대화시작")
    .setDescription("Gemini 봇이 응답할 채널을 설정합니다")
    .addStringOption((option) =>
      option
        .setName("채널아이디")
        .setDescription("봇이 대화할 채널의 ID를 입력하세요")
        .setRequired(true),
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("대화중지")
    .setDescription("현재 설정된 대화 채널을 해제합니다")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("대화초기화")
    .setDescription("현재 채널의 대화 기록을 초기화합니다")
    .toJSON(),
];

export async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);
  try {
    logger.info("슬래시 커맨드 등록 중...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.info("슬래시 커맨드 등록 완료");
  } catch (err) {
    logger.error({ err }, "슬래시 커맨드 등록 실패");
  }
}
