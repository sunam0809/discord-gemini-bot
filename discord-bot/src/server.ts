import http from "node:http";

/**
 * Render 무료 플랜 유지 + UptimeRobot 헬스체크용 HTTP 서버
 */
export function startHealthServer(): void {
  const port = parseInt(process.env["PORT"] ?? "8080", 10);

  const server = http.createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Discord Bot is running 🤖");
  });

  server.listen(port, () => {
    console.log(`✅ Health server running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/healthz`);
  });
}
