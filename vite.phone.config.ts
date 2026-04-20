import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(__dirname, 'phone-ui'),
  build: {
    outDir: path.resolve(__dirname, 'phone-ui-dist'),
    emptyOutDir: true,
  },
})