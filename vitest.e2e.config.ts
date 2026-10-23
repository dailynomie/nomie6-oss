import { defineConfig } from 'vitest/config'

// The end-to-end smoke tests (F9). They drive the app in a browser, so they run on their own:
// `npm run e2e`. The unit tests (`npm test`) do not include them.
export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 300000,
    hookTimeout: 120000,
  },
})
