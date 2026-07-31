import {
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  new SlashCommandBuilder()
    .setName("대화시작")
    .setDescription("봇이 응답할 채널을 설정합니다")
    .addChannelOption((opt) =>
      opt
        .setName("채널")
        .setDescription("봇이 대화할 채널을 선택하세요")
        .addChannelTypes(ChannelType.GuildText)
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

  new SlashCommandBuilder()
    .setName("상태")
    .setDescription("현재 봇의 대화 채널 설정을 확인합니다")
    .toJSON(),
];

export async function registerCommands(
  token: string,
  clientId: string,
): Promise<void> {
  const rest = new REST().setToken(token);
  console.log("슬래시 커맨드 등록 중...");
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("슬래시 커맨드 등록 완료 ✅");
}
