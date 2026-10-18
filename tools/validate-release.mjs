/**
 * 用 Studio 自带的 manifest 校验器（sdk/types/validate-manifest.ts）
 * 校验待发布目录里的 extension.json，避免上传后才发现清单不合法。
 *
 * 用法：node tools/validate-release.mjs [发布目录，默认 release/duel-card-forge]
 */
import ts from "typescript";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const target = process.argv[2] ?? join("release", "duel-card-forge");
const out = join(root, "tools", "tmp", "validate");
const sdkDir =
  "D:\\letsgal-studio\\LetsGal Studio\\resources\\app.asar.unpacked\\dist\\sdk";

function transpileTree(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      transpileTree(full);
      continue;
    }
    if (!name.endsWith(".ts") || name.endsWith(".d.ts")) continue;
    const rel = relative(sdkDir, full).replace(/\\/g, "/");
    const outRel = rel.replace(/\.ts$/, ".mjs");
    const outPath = join(out, outRel);
    mkdirSync(dirname(outPath), { recursive: true });
    const code = ts.transpileModule(readFileSync(full, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.ESNext,
      },
      fileName: rel,
    }).outputText;
    const dstDir = dirname(outPath);
    const srcDir = dirname(full);
    const rewritten = code.replace(
      /(from\s+["'])(\.[^"']*)(["'])/g,
      (m, a, spec, c) => {
        if (/\.mjs$/.test(spec)) return m;
        // 用源文件的 .ts 是否存在来判断（转译顺序不确定）
        if (existsSync(join(srcDir, `${spec}.ts`))) return `${a}${spec}.mjs${c}`;
        if (existsSync(join(srcDir, spec, "index.ts"))) {
          return `${a}${spec}/index.mjs${c}`;
        }
        void dstDir;
        return m;
      },
    );
    writeFileSync(outPath, rewritten);
  }
}

transpileTree(sdkDir);

const { validateExtensionManifest } = await import(
  pathToFileURL(join(out, "types", "validate-manifest.mjs")).href
);

const manifestPath = join(root, target, "extension.json");
const raw = JSON.parse(readFileSync(manifestPath, "utf8"));

try {
  const manifest = validateExtensionManifest(raw);
  console.log(`清单校验通过：${relative(root, manifestPath)}`);
  console.log(
    JSON.stringify(
      {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        entry: manifest.entry,
        hasProgram: manifest.hasProgram,
        sdkVersion: manifest.sdkVersion,
        icon: manifest.icon,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("清单校验失败：", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
