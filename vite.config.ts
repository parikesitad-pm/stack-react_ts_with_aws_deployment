import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  ssr: {
    noExternal: [/@atlaskit/],
  },
  server: {
    port: 5173,
    host: true,
  },
});
