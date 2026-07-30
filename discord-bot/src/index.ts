import { startBot } from "./bot.js";
import { startHealthServer } from "./server.js";

// Render 헬스체크용 HTTP 서버 시작
startHealthServer();

// Discord 봇 시작
startBot().catch((err) => {
  console.error("봇 시작 실패:", err);
  process.exit(1);
});
