import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'
import { VitePWA } from 'vite-plugin-pwa'
// import loadVersion from 'vite-plugin-package-version'
import manifest from './manifest'
import path from 'path'
import svelteSVG from 'vite-plugin-svelte-svg'
import { visualizer } from 'rollup-plugin-visualizer'
import rollupPluginsSvelte from 'rollup-plugin-svelte-svg'

import { string } from 'rollup-plugin-string'

// Polyfill structuredClone for vite-plugin-pwa
if (!globalThis.structuredClone) {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj))
}

export default defineConfig({
  worker: { format: 'es' },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  optimizeDeps: {
    allowNodeBuiltins: ['pouchdb-browser', 'pouchdb-utils'],
    exclude: ['canvas-confetti', 'tributejs', 'svelte-navigator'],
  },
  build: {
    // top-level await (the chosen language is loaded before the app); iOS 15 and later support it
    target: ['es2022', 'safari15', 'chrome100'],
    // workers are ES modules, so they can share code with the app (the CSV worker imports domain code that loads languages)
    // (see the build section below)
    rollupOptions: {
      // external: ['aws-sdk','aws-sdk/clients/S3'],
      output: {
        // globals: {
        //   'aws-sdk': 'AWS',
        //   'S3': 'aws-sdk/clients/S3'
        // },
        // Libraries that change rarely get their own files, so they stay cached after an app update
        manualChunks(id) {
          if (id.includes('/node_modules/svelte/')) return 'vendor-svelte'
          if (id.includes('/node_modules/dayjs/')) return 'vendor-dayjs'
          if (id.includes('/node_modules/pouchdb')) return 'vendor-pouchdb'
        },
      },
      plugins: [
        // ANALYZE=1 npm run vbuild writes the bundle report (raw data, for the size baseline)
        ...(process.env.ANALYZE
          ? [visualizer({ filename: process.env.ANALYZE, template: 'raw-data', gzipSize: true })]
          : []),
        rollupPluginsSvelte,
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('/src'),
    },
  },
  plugins: [
    svelte({}),
    svelteSVG({
      svgoConfig: {}, // See https://github.com/svg/svgo#configuration
    }),

    VitePWA({
      manifest: manifest,
      maximumFileSizeToCacheInBytes: 4 * 1024 ** 2, // the largest file that is cached in advance (the app chunk is about 1.7 MB)

      // Workbox configuration for intelligent caching strategies
      workbox: {
        // HTML - always network first (want latest version)
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Only the shell and the start pages are cached in advance. Every other page is cached (CacheFirst, the /assets/ rule
        // below) the first time it is opened, so the first install stays small.
        globPatterns: [
          '*.{html,webmanifest,ico}',
          'app-icons/**/*.png',
          'images/*.{png,svg}',
          'assets/*.css',
          'assets/index-*.js',
          'assets/vendor-*.js',
        ],

        // Caching strategies for different asset types
        runtimeCaching: [
          // API calls - network first with cache fallback
          {
            urlPattern: /^https?:\/\/(?:api\.|localhost:|127\.0\.0\.1:)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images - cache first with network fallback
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Hashed build files under /assets/ - cache first, the name changes with every build
          {
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // Other JS and CSS (unhashed, such as public/js/vendors.js and plugin scripts) -
          // serve the cached copy, but fetch the new one in the background for the next load
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'scripts-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // Fonts - cache first with long expiry
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
            },
          },
        ],

        // Clean up old caches on activation
        cleanupOutdatedCaches: true,

        // Skip waiting (apply updates immediately)
        skipWaiting: false, // Keep false for controlled updates via PWAService
        clientsClaim: true,
      },

      // Development options
      devOptions: {
        enabled: false, // PWA disabled in dev mode (as implemented in PWAService)
      },
    }),
  ],
})
