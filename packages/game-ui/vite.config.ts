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
      external: ['winston'],
      output: {
        manualChunks: {
          pixi: ['pixi.js']
        }
      },
      onwarn(warning, warn) {
        // Suppress warnings about missing exports from PixiJS
        if (warning.code === 'MISSING_EXPORT' && warning.source?.includes('pixi.js')) {
          return;
        }
        warn(warning);
      }
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
      process: 'process/browser',
      // Fix for PixiJS v8 missing globalHooks
      './utils/globalThis/globalHooks.mjs': 'data:text/javascript,export default {};',
      './globalThis/globalHooks.mjs': 'data:text/javascript,export default {};'
    }
  },
  optimizeDeps: {
    include: ['@npzr/core', '@npzr/ai', '@npzr/logging', '@npzr/ui-react', 'pixi.js']
  }
});
