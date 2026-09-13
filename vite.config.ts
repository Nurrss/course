import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // UsersAdminPage lazy-loads xlsx (SheetJS) only for the admin import
    // flow — it's fine for that one chunk to exceed the default warning size.
    chunkSizeWarningLimit: 600,
  },
})
