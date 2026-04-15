import { defineConfig } from 'vite';

export default defineConfig({
  ssr: {
    noExternal: false,
  },
  build: {
    ssr: false,
  },
  server: {
    middlewareMode: false,
  },
});
