import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      output: {
        sourcemap: false,
        format: "iife",
        entryFileNames: "app[hash].js",
        assetFileNames: "[name][hash][extname]",
        // chunkFileNames: "[name].js",
      },
    },
    cssCodeSplit: false,
  },
  plugins: [react()],
});
