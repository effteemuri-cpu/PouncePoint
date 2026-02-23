import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple config for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: './',
})