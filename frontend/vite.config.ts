import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    /** Listen on all interfaces so other devices on your LAN can open http://<your-laptop-ip>:5173 */
    host: true,
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
