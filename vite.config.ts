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
  // `minify: true` (esbuild) no elimina las llamadas a consola, asi que todos
  // los console.log del proyecto acababan en el bundle. Se descartan solo los
  // informativos: console.error y console.warn se conservan porque son el
  // unico canal de diagnostico del IDE (no hay Sentry ni ErrorBoundary).
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
