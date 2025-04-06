import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    watch: {
      usePolling: true
    }
  },
  base: '/all-log-rythm/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})
