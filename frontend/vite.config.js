import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-router': fileURLToPath(new URL('./src/shims/vue-router.ts', import.meta.url)),
      '@vueuse/core': fileURLToPath(new URL('./src/shims/vueuse-core.ts', import.meta.url)),
      '@capacitor/core': fileURLToPath(new URL('./src/shims/capacitor.ts', import.meta.url)),
      '@capacitor/camera': fileURLToPath(new URL('./src/shims/capacitor.ts', import.meta.url)),
      '@capacitor/haptics': fileURLToPath(new URL('./src/shims/capacitor.ts', import.meta.url)),
      '@capacitor/browser': fileURLToPath(new URL('./src/shims/capacitor.ts', import.meta.url)),
      '@capacitor/preferences': fileURLToPath(new URL('./src/shims/capacitor.ts', import.meta.url)),
      yup: fileURLToPath(new URL('./src/shims/yup.ts', import.meta.url)),
      axios: fileURLToPath(new URL('./src/shims/axios.ts', import.meta.url)),
    },
  },
})
