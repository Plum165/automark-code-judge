import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // 1. Keep your original plugins
    plugins: [react(), tailwindcss()],

    // 2. Keep your environment definitions
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    // 3. Keep your path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // 4. MERGED Server Settings
    server: {
      // Keep original HMR setting
      hmr: process.env.DISABLE_HMR !== 'true',

      // ADD the JDoodle Proxy here
      proxy: {
        '/api/execute': {
          target: 'https://api.jdoodle.com/v1/execute',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/execute/, ''),
        },
      },
    },
  };
});