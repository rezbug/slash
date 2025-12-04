#!/usr/bin/env bun
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(pkgRoot, "dist");
const entryFile = join(pkgRoot, "src/index.ts");
const tsconfigPath = fileURLToPath(new URL("../../../tsconfig.build.json", import.meta.url));

async function run(cmd: string[], label: string): Promise<void> {
  const child = Bun.spawn({
    cmd,
    cwd: pkgRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`${label} exited with code ${exitCode}`);
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await run(
  ["bun", "build", entryFile, "--outfile", join(distDir, "index.mjs"), "--format", "esm", "--minify"],
  "bun build (esm)"
);
console.log("✓ built dist/index.mjs");
await run(
  ["bun", "build", entryFile, "--outfile", join(distDir, "index.cjs"), "--format", "cjs", "--minify"],
  "bun build (cjs)"
);
console.log("✓ built dist/index.cjs");
await run(["tsc", "-p", tsconfigPath], "tsc");
console.log("✓ emitted type declarations");

console.log("✔ build finished");
