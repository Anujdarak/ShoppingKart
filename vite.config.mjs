import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Bypass proxy for direct browser navigation/refresh requests (Accept: text/html)
const bypassHtml = (req) => {
  if (req.headers && req.headers.accept && req.headers.accept.includes('text/html')) {
    return '/index.html';
  }
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/customers': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        bypass: bypassHtml,
      },
      '/products': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        bypass: bypassHtml,
      },
      '/wishlist': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        bypass: bypassHtml,
      },
      '/cart': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        bypass: bypassHtml,
      },
      '/orders': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        bypass: bypassHtml,
      },
    },
  },
});
