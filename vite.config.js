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
  // GNEWS_API_KEY or VITE_GNEWS_API_KEY (same for OpenWeather/NewsData) —
  // whichever naming someone reaches for, it works, without loosening that
  // safeguard for anything else in the project.
  const env = loadEnv(mode, process.cwd(), '')
  const resolvedKey = (bareName, viteName) => env[viteName] || env[bareName] || ''

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(
        resolvedKey('OPENWEATHER_API_KEY', 'VITE_OPENWEATHER_API_KEY'),
      ),
      'import.meta.env.VITE_GNEWS_API_KEY': JSON.stringify(
        resolvedKey('GNEWS_API_KEY', 'VITE_GNEWS_API_KEY'),
      ),
      'import.meta.env.VITE_NEWSDATA_API_KEY': JSON.stringify(
        resolvedKey('NEWSDATA_API_KEY', 'VITE_NEWSDATA_API_KEY'),
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
