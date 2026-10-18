import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// 宿主提供 React / ReactDOM / @avg-studio/sdk 单实例，bundle 只保留对它们的 import。
const externals = [/^react($|\/)/, /^react-dom($|\/)/, "@avg-studio/sdk"];

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es"],
      fileName: () => "index.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: externals,
      output: {
        // 保持可读的模块结构，便于在 Studio 报错时定位。
        chunkFileNames: "[name].js",
      },
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
