import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {copyFileSync} from 'fs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isExtensionBuild =
    process.env.BUILD_TARGET === 'firefox' || process.env.BUILD_TARGET === 'chromium';
  return {
    base: isExtensionBuild ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-extension-files',
        apply: 'build',
        writeBundle() {
          copyFileSync('public/background.js', 'dist/background.js');
          const manifestSource =
            process.env.BUILD_TARGET === 'firefox'
              ? 'public/manifest.firefox.json'
              : 'public/manifest.json';
          copyFileSync(manifestSource, 'dist/manifest.json');
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
