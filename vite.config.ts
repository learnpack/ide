import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
  // `minify: true` (esbuild) minifies but does not strip console calls, so
  // every console.log in the project used to end up in the bundle. Only the
  // informational ones are dropped: console.error and console.warn are kept
  // because they are the IDE's only diagnostic channel (there is no Sentry
  // and no ErrorBoundary).
  esbuild: {
    pure: ["console.log", "console.debug", "console.info"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
