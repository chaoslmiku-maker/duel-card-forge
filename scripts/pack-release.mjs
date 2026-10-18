/**
 * 生成两种分发包：
 *   release/duel-card-forge/            纯运行包（给玩家导入 Studio 用）
 *   submit/duel-card-forge/             源码包（给扩展工坊提交用，含 package.json）
 *
 * 两个目录都只从当前源码与 dist 复制，不包含 node_modules。
 * 用法：node scripts/pack-release.mjs
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const name = "duel-card-forge";
const manifest = JSON.parse(readFileSync(join(root, "extension.json"), "utf8"));
const version = manifest.version;
const zipBase = `${name}-v${version}`;

const releaseDir = join(root, "release", name);
const submitDir = join(root, "submit", name);

function fresh(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function copy(from, to) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.warn(`跳过（不存在）：${from}`);
    return;
  }
  cpSync(src, join(to, from), { recursive: true });
}

// ---- 纯运行包：只放 Studio 运行时需要的东西 ----
fresh(releaseDir);
for (const item of ["extension.json", "README.md", "LICENSE", "assets", "dist"]) {
  copy(item, releaseDir);
}

// ---- 源码包：工坊提交需要 package.json + 源码 + dist ----
fresh(submitDir);
for (const item of [
  "extension.json",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "vite.config.ts",
  "vite.preview.config.ts",
  ".npmrc",
  ".gitignore",
  "README.md",
  "PUBLISH.md",
  "LICENSE",
  "src",
  "sdk",
  "scripts",
  "assets",
  "dist",
  "preview",
  "tools",
]) {
  copy(item, submitDir);
}
// 提交包里不需要预览打包产物与测试临时目录
rmSync(join(submitDir, "preview", "dist"), { recursive: true, force: true });

// 写一份版本信息，便于核对产物来源
const stamp = {
  name: manifest.name,
  id: manifest.id,
  version,
  entry: manifest.entry,
  generatedAt: new Date().toISOString(),
};
for (const dir of [releaseDir, submitDir]) {
  writeFileSync(
    join(dir, "build-info.json"),
    `${JSON.stringify(stamp, null, 2)}\n`,
    "utf8",
  );
}

console.log(`已生成 ${name} v${version}`);
console.log(`  运行包：release/${name}/`);
console.log(`  源码包：submit/${name}/`);
console.log(`打包命令（可选）：Compress-Archive 或 zip -r ${zipBase}.zip ${name}`);
