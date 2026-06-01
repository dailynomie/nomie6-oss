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

// Polyfills for Node 16 compatibility
if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function(predicate, thisArg) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
    const len = this.length >>> 0;
    const relativeIndex = Math.trunc(index) || 0;
    const actualIndex = relativeIndex < 0 ? len + relativeIndex : relativeIndex;
    if (actualIndex < 0 || actualIndex >= len) {
      return undefined;
    }
    return this[actualIndex];
  };
}

export default defineConfig({
  define: {
    'globalThis.structuredClone': '(obj) => JSON.parse(JSON.stringify(obj))',
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  esbuild: {
    loader: 'ts',
  },
  optimizeDeps: {
    allowNodeBuiltins: ['pouchdb-browser', 'pouchdb-utils'],
    exclude: ['canvas-confetti', 'tributejs', 'svelte-navigator'],
  },
  build: {
    rollupOptions: {
      // external: ['aws-sdk','aws-sdk/clients/S3'],
      output: {
        // globals: {
        //   'aws-sdk': 'AWS',
        //   'S3': 'aws-sdk/clients/S3'
        // },
      },
      plugins: [
        // visualizer({ filename: 'stats.html' }),
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
    svelte({

    }),
    svelteSVG({
      svgoConfig: {}, // See https://github.com/svg/svgo#configuration
    }),

    VitePWA({
      manifest: manifest,
      maximumFileSizeToCacheInBytes: 10 * 1024 ** 2, // 10 MB
    }),
  ],
})
