import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ECONNREFUSED') return;
            console.warn('API Proxy error:', err.message);
          });
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Ignore normal browser close / reload socket disconnects
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ECONNREFUSED') return;
            console.warn('WS Proxy error:', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/qrcodes': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

