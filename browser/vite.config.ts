import path from 'node:path'

import {defineConfig} from 'vite'

export default defineConfig({
  server: {
    port: 3338,
  },
  resolve: {
    alias: {
      'rx-vcr': path.resolve(__dirname, '../src'),
    },
  },
})
