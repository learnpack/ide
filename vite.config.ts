import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  build: {
    minify: true,
    rollupOptions: {
      output: {
        sourcemap: false,
        format: "iife",
        entryFileNames: "app.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'app.css';
          }
          return '[name][hash][extname]';
        },
      },
    },
    cssCodeSplit: false,
  },
  plugins: [react()],
});
