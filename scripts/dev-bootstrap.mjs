import "dotenv/config";
import { spawnSync } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const isWindows = process.platform === "win32";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

/** Host/port MySQL lấy từ DATABASE_URL trong .env. */
function databaseTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Thiếu DATABASE_URL trong .env (xem .env.example).");
  const url = new URL(raw);
  const host = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
  return { host, port: Number(url.port || 3306) };
}

/** Thử mở kết nối TCP tới MySQL. */
function canConnect({ host, port }, timeoutMs = 1500) {
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

function hasDocker() {
  const result = spawnSync("docker", ["--version"], { cwd: root, stdio: "ignore", shell: isWindows });
  return result.status === 0;
}

async function startDockerMysql() {
  console.log("Starting MySQL (Docker)...");
  run("docker", ["compose", "-f", "infra/docker-compose.yml", "up", "-d", "mysql"]);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync("docker", ["inspect", "--format={{.State.Health.Status}}", "smart-event-mysql"], {
      cwd: root,
      encoding: "utf8",
      shell: isWindows,
    });
    if (result.status === 0 && result.stdout.trim() === "healthy") return;
    await delay(1000);
  }
  throw new Error("MySQL chưa healthy sau 60 giây; kiểm tra Docker Desktop và infra/docker-compose.yml.");
}

async function main() {
  const target = databaseTarget();
  const where = `${target.host}:${target.port}`;

  if (await canConnect(target)) {
    // MySQL đã chạy sẵn (npm run db:local, MySQL cài trên máy, hoặc container Docker đã bật).
    console.log(`MySQL đang chạy tại ${where}, bỏ qua bước Docker.`);
  } else if (hasDocker()) {
    await startDockerMysql();
  } else {
    throw new Error(
      [
        `Không kết nối được MySQL tại ${where} và máy không có Docker.`,
        "Cách chạy không cần Docker:",
        "  1. Mở một cửa sổ terminal khác, chạy: npm run db:local   (giữ cửa sổ đó mở)",
        "  2. Quay lại đây chạy lại: npm run dev",
        "Kiểm tra cổng trong DATABASE_URL (.env) khớp với cổng MySQL đang chạy.",
      ].join("\n"),
    );
  }

  console.log("Preparing demo database...");
  const prisma = isWindows ? "npx.cmd" : "npx";
  run(prisma, ["prisma", "generate", "--schema", "prisma/schema.prisma"]);
  run(prisma, ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]);
  run(prisma, ["prisma", "db", "seed", "--schema", "prisma/schema.prisma"]);
  console.log("MySQL migration and demo seed are ready.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
