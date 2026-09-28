import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Las llamadas a /api se envían al servidor Express (server/index.ts).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
