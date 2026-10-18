import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

/**
 * 浏览器预览专用构建：把所有依赖（含 React）打进一个 IIFE，
 * 用 preview/sdk-shim 替换 @avg-studio/sdk，方便不启动 Studio 也能看界面。
 * 正式扩展仍使用根目录 vite.config.ts（SDK / React 外置）。
 */
export default defineConfig({
  build: {
    outDir: "preview/dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    lib: {
      entry: fileURLToPath(new URL("./preview/entry.tsx", import.meta.url)),
      formats: ["iife"],
      name: "DuelCardForgePreview",
      fileName: () => "app.js",
    },
  },
  resolve: {
    alias: {
      "@avg-studio/sdk": fileURLToPath(
        new URL("./preview/sdk-shim.ts", import.meta.url),
      ),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  esbuild: {
    jsx: "automatic",
  },
});
