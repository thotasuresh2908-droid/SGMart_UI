/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// During development the web app runs on http://localhost:5173 and forwards
// API calls, Google sign-in and live updates to the Spring Boot backend on :8080.
// Everything then shares one origin, so the session cookie and CSRF cookie just work.
const backend = 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/oauth2': backend,
      '/login/oauth2': backend,
      '/ws': { target: backend, ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
