#!/usr/bin/env bun
import { fileURLToPath } from "node:url";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const tsconfigPath = fileURLToPath(new URL("../../../tsconfig.build.json", import.meta.url));

type Spawned = ReturnType<typeof Bun.spawn>;

function spawnWatch(cmd: string[], label: string): Spawned {
  const child = Bun.spawn({
    cmd,
    cwd: pkgRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  child.exited.then((code) => {
    if (code !== 0) {
      console.error(`${label} watcher exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });
  return child;
}

const jsWatcher = spawnWatch(
  ["bun", "build", "src/index.ts", "--outdir", "dist", "--format", "esm", "--watch"],
  "bun"
);
const typesWatcher = spawnWatch(
  ["tsc", "-w", "-p", tsconfigPath, "--preserveWatchOutput"],
  "tsc"
);

function shutdown(signal: NodeJS.Signals): void {
  console.log(`\nReceived ${signal}; shutting down watchers…`);
  jsWatcher.kill("SIGINT");
  typesWatcher.kill("SIGINT");
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await Promise.race([jsWatcher.exited, typesWatcher.exited]);
