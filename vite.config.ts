import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const buildCommit = process.env.GITHUB_SHA || process.env.VITE_COMMIT_SHA || 'development';

const buildInfoPlugin = {
  name: 'build-info',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'build-info.json',
      source: JSON.stringify({
        commit: buildCommit,
        builtAt: new Date().toISOString(),
      }),
    });
  },
};

export default defineConfig(() => {
  return {
    define: {
      __BUILD_COMMIT__: JSON.stringify(buildCommit),
    },
    plugins: [react(), tailwindcss(), buildInfoPlugin],
    base: './', // Use relative path for GitHub Pages compatibility
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
  };
});
