import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.js',
    globals: true,
    clearMocks: true,
  },
  server: {
    port: 3001,
    strictPort: false, // Allow automatic port selection if 3001 is busy
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
