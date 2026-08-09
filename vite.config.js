import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Vite only exposes env vars prefixed with VITE_ to client code by default
  // (a deliberate safeguard against leaking server secrets into the browser
  // bundle). Loading with an empty prefix here lets .env accept either
  // OPENWEATHER_API_KEY or VITE_OPENWEATHER_API_KEY — whichever naming
  // someone reaches for, it works.
  //
  // IMPORTANT: this convenience is intentionally NOT extended to the news
  // key. GNEWS_API_KEY is read directly by api/news.js on the server
  // (process.env, outside of Vite entirely) and must never be bundled into
  // client JS — that would defeat the whole point of proxying it. The
  // separate, distinctly-named VITE_GNEWS_DEV_KEY below is the only news
  // key the client ever sees, and only via Vite's normal built-in
  // VITE_-prefix handling (no custom resolution, so there's no path by
  // which the server-side GNEWS_API_KEY could end up in the client bundle).
  const env = loadEnv(mode, process.cwd(), '')
  const resolvedKey = (bareName, viteName) => env[viteName] || env[bareName] || ''

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(
        resolvedKey('OPENWEATHER_API_KEY', 'VITE_OPENWEATHER_API_KEY'),
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router') || id.includes('/react/') || id.includes('react-dom')) return 'vendor';
              if (id.includes('leaflet')) return 'maps';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('framer-motion')) return 'motion';
            }
          },
        },
      },
    },
  }
})
