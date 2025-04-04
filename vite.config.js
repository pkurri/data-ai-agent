import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/datasets': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/clean': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
});
