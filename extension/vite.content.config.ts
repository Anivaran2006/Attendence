import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        entryFileNames: 'content.js',
        format: 'iife',
        name: 'ABESContentScript',
      },
    },
  },
});
