import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log('🔄 Proxying:', path, '→', `http://127.0.0.1:8000${path}`)
          return path
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`📤 ${req.method} ${req.url} → http://127.0.0.1:8000${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`📥 ${proxyRes.statusCode} ${req.url}`)
          })
        }
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
