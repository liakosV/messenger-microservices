import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = {
    '/identity': {
      target: env.IDENTITY_PROXY_TARGET || 'http://localhost:8082',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/identity/, ''),
    },
    '/chat': {
      target: env.CHAT_PROXY_TARGET || 'http://localhost:8083',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/chat/, ''),
    },
    '/ws/chat': {
      target: env.CHAT_PROXY_TARGET || 'http://localhost:8083',
      ws: true,
      changeOrigin: true,
    },
  };
  return {
    plugins: [react()],
    server: { host: 'localhost', port: 5173, strictPort: true, proxy },
    preview: { host: 'localhost', port: 5173, strictPort: true, proxy },
  };
});
