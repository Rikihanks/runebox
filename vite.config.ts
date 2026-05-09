import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages deployment, set base to your repo name:
//   vite build --base=/your-repo-name/
// Or set VITE_BASE env variable.
// Default: '/' works for custom domains or dev server.

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: {
    proxy: {
      '/api/cards': {
        target: 'https://api.dotgg.gg/cgfw/getcards?game=riftbound&mode=indexed',
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
})
