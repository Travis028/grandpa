import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app_icon-192.png', 'app_icon-512.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'APOLLO J. FIZVALENTINE OWINO Memorial',
        short_name: 'Memorial',
        description: 'In Loving Memory of APOLLO J. FIZVALENTINE OWINO',
        theme_color: '#1A2530',
        background_color: '#1A2530',
        display: 'standalone',
        icons: [
          {
            src: 'app_icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app_icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Cache all static files and images
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /\/api\/(grandpa|family|program|memories|life_photos|tributes)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /\/api\/static\/images\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:5000',
        ws: true,
      }
    }
  }
})
