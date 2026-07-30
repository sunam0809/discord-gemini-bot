import http from "node:http";

/**
 * Render 무료 플랜은 웹 서비스가 포트를 열어야 유지됩니다.
 * 봇 프로세스와 함께 최소 HTTP 서버를 실행합니다.
 */
export function startHealthServer(): void {
  const port = parseInt(process.env["PORT"] ?? "8080", 10);

  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Discord Bot is running 🤖");
  });

  server.listen(port, () => {
    console.log(`✅ Health server running on port ${port}`);
  });
}
