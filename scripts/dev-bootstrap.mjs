import { spawnSync } from "node:child_process";
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

async function main() {
  console.log("Starting MySQL and preparing demo database...");
  run("docker", ["compose", "-f", "infra/docker-compose.yml", "up", "-d", "mysql"]);

  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync("docker", ["inspect", "--format={{.State.Health.Status}}", "smart-event-mysql"], {
      cwd: root,
      encoding: "utf8",
      shell: isWindows,
    });
    if (result.status === 0 && result.stdout.trim() === "healthy") {
      healthy = true;
      break;
    }
    await delay(1000);
  }
  if (!healthy) throw new Error("MySQL chưa healthy sau 60 giây; kiểm tra Docker Desktop và infra/docker-compose.yml.");

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
