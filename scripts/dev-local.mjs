// Một lệnh cho máy không có Docker: bật MySQL local (infra/local-mysql) → đợi sẵn sàng → chạy `npm run dev` (API + web).
// Dùng: npm run dev:local   ·   Ctrl+C: tắt API, web và MySQL (MySQL chỉ bị tắt nếu do lệnh này bật).
import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const isWindows = process.platform === "win32";
const WAIT_SECONDS = 90;

function databaseTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Thiếu DATABASE_URL trong .env (xem .env.example).");
  const url = new URL(raw);
  return { host: url.hostname === "localhost" ? "127.0.0.1" : url.hostname, port: Number(url.port || 3306) };
}

function canConnect({ host, port }, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function powershell(script) {
  return ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `infra/local-mysql/${script}`];
}

let mysql = null; // tiến trình db:local nếu lệnh này tự bật MySQL
let dev = null;
let stopping = false;

function stopMysql() {
  if (!mysql) return;
  console.log("\nĐang tắt MySQL local...");
  // mysqld có thể đã tự tắt khi nhận Ctrl+C từ console; lỗi ở bước này không quan trọng.
  spawnSync("powershell", powershell("stop.ps1"), { cwd: root, stdio: "inherit" });
  mysql = null;
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  if (dev && dev.exitCode === null) dev.kill();
  stopMysql();
  process.exit(code);
}

async function main() {
  if (!isWindows) throw new Error("dev:local dùng MySQL Server cài trên Windows. Máy khác hãy dùng Docker: npm run dev");

  const target = databaseTarget();
  if (await canConnect(target)) {
    console.log(`MySQL đã chạy sẵn tại ${target.host}:${target.port}, dùng luôn (khi thoát sẽ không tắt nó).`);
  } else {
    console.log("Đang bật MySQL local...");
    mysql = spawn("powershell", powershell("start.ps1"), { cwd: root, stdio: "inherit" });
    mysql.once("exit", (code) => {
      if (stopping) return;
      mysql = null;
      console.error(`MySQL local đã dừng (mã ${code}). Tắt API và web.`);
      shutdown(code || 1);
    });

    let ready = false;
    for (let i = 0; i < WAIT_SECONDS * 2 && !ready; i += 1) {
      await delay(500);
      ready = await canConnect(target);
    }
    if (!ready) throw new Error(`Quá ${WAIT_SECONDS} giây mà MySQL chưa mở cổng ${target.port}.`);
  }

  // `npm run dev` tự migrate + seed (scripts/dev-bootstrap.mjs) rồi chạy API và web.
  dev = spawn("npm", ["run", "dev"], { cwd: root, stdio: "inherit", shell: true });
  dev.once("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});
