import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor expects the built output in 'dist'
  build: {
    outDir: 'dist',
    // Ensure assets use relative paths so Capacitor can load them from the bundle
    assetsDir: 'assets',
  },
  server: {
    port: 3002,
    proxy: {
      '/api':  { target: 'http://localhost:5001', changeOrigin: true },
      '/auth': { target: 'http://localhost:5001', changeOrigin: true }
    }
  }
});
