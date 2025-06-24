import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        copyFileSync('manifest.json', 'dist/manifest.json')
        
        // Copy icon files
        try {
          copyFileSync('public/icon-16.png', 'dist/icon-16.png')
          copyFileSync('public/icon-48.png', 'dist/icon-48.png')
          copyFileSync('public/icon-128.png', 'dist/icon-128.png')
        } catch {}
        
        // Copy options files
        try {
          mkdirSync('dist/src/options', { recursive: true })
          copyFileSync('src/options/options.html', 'dist/src/options/options.html')
          copyFileSync('src/options/options.css', 'dist/src/options/options.css')
          copyFileSync('src/options/options.js', 'dist/src/options/options.js')
        } catch {}
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/service-worker.js'),
        content: resolve(__dirname, 'src/content/content-script.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development'
  }
})