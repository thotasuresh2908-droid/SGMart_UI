/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// The web app always calls relative paths (/api/v1, /oauth2, /login/oauth2, /ws).
//  - Local development: Vite forwards them to the backend below.
//  - Production (Render static site): render.yaml rewrite rules forward them to the backend.
// Either way the browser sees one address, so the session and CSRF cookies just work.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local backend by default. To browse against the deployed backend instead, set
  // VITE_DEV_BACKEND=https://sgmart-backend.onrender.com in .env.local
  // (Google sign-in then needs the deployed site; guest shopping and orders work locally).
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:9001'
  const remote = backend.startsWith('https://')
  const forward = { target: backend, changeOrigin: remote, secure: true }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': forward,
        '/oauth2': forward,
        '/login/oauth2': forward,
        '/ws': { ...forward, ws: true },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
      testTimeout: 15000,   // long click-through tests on slower machines
    },
  }
})
