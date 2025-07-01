import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/, /packages/]
    },
    rollupOptions: {
      external: ['winston']
    }
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"development"'
  },
  resolve: {
    alias: {
      util: 'util',
      os: 'os-browserify/browser',
      process: 'process/browser'
    }
  },
  optimizeDeps: {
    include: ['@npzr/core', '@npzr/ai', '@npzr/logging', '@npzr/ui-react']
  }
});
