import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isWP = process.env.BUILD_TARGET === 'wp'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages: /dex/  |  WordPress plugin: ./ (relative, served from plugin dir)
  base: isWP ? './' : '/dex/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: isWP ? 'build-wp' : 'build',
    sourcemap: false,
    rollupOptions: {
      output: isWP
        ? {
            // Predictable filenames for WordPress plugin (no hashes)
            entryFileNames: 'app.js',
            chunkFileNames: 'assets/[name].js',
            // Rename CSS to app.css for predictable WP enqueue
            assetFileNames: (info) =>
              info.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name].[ext]',
          }
        : {
            // Code-split for GitHub Pages (better caching)
            manualChunks: {
              react: ['react', 'react-dom'],
              wagmi: ['wagmi', 'viem'],
              appkit: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
              uniswap: ['@uniswap/v3-sdk', '@uniswap/sdk-core'],
            },
          },
    },
  },
})
