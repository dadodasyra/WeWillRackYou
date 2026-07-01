import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.warn("prepare-standalone: .next/standalone/server.js not found, skipping");
  process.exit(0);
}

function copyDir(from, to) {
  if (!existsSync(from)) return;
  cpSync(from, to, { recursive: true });
}

copyDir(join(root, "public"), join(standaloneDir, "public"));
mkdirSync(join(standaloneDir, ".next"), { recursive: true });
copyDir(join(root, ".next", "static"), join(standaloneDir, ".next", "static"));

// Prisma native client (same layout as Dockerfile)
copyDir(join(root, "prisma"), join(standaloneDir, "prisma"));
mkdirSync(join(standaloneDir, "node_modules"), { recursive: true });
copyDir(join(root, "node_modules", ".prisma"), join(standaloneDir, "node_modules", ".prisma"));
copyDir(join(root, "node_modules", "@prisma"), join(standaloneDir, "node_modules", "@prisma"));

console.log("prepare-standalone: copied public, static, and Prisma into .next/standalone");
