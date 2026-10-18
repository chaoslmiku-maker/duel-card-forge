/**
 * 构建后处理：把 vite 产出的 dist/index.js 复制一份 dist/index.mjs。
 *
 * 工坊提交前的检查固定寻找 dist/index.mjs（Studio 脚手架默认入口名），
 * 而扩展清单里的 entry 才是运行时真正加载的路径。两份内容完全一致，
 * 这样既能通过工坊检查，也不影响本地加载。
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const js = join(dist, "index.js");
const mjs = join(dist, "index.mjs");

if (!existsSync(js)) {
  console.error("找不到 dist/index.js，请先执行 vite build。");
  process.exit(1);
}

copyFileSync(js, mjs);
console.log("已生成 dist/index.mjs");

const jsMap = join(dist, "index.js.map");
if (existsSync(jsMap)) {
  copyFileSync(jsMap, join(dist, "index.mjs.map"));
  console.log("已生成 dist/index.mjs.map");
}
