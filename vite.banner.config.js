import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "proposal/assets/vendor",
    emptyOutDir: false,
    lib: {
      entry: path.resolve("src/banner-hero.jsx"),
      name: "SumaBannerHero",
      formats: ["iife"],
      fileName: () => "banner-hero.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: "banner-hero.[ext]",
      },
    },
    cssCodeSplit: false,
  },
});
