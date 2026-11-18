import 'dotenv/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import app from './server/app.js'

// `npm run dev` / `npm run preview` answer /api themselves, so there is no second server to forget.
// Production runs the same app on Vercel (api/index.js).
const mountApi = (server) => {
  server.middlewares.use((req, res, next) => (req.url.startsWith('/api') ? app(req, res, next) : next()))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), { name: 'api', configureServer: mountApi, configurePreviewServer: mountApi }],
  server: {
    port: 5173,
  },
})
