import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  
  build: {
    minify: false,
    rollupOptions: {
      output: {
        sourcemap:  true,
        format: 'iife', // or 'umd'
      },
    },
  },
  plugins: [react()],
})
