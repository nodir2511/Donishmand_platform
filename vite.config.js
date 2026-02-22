import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Donishmand_platform/',
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-i18next', 'i18next'],
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@dnd-kit/core', '@dnd-kit/sortable']
        }
      }
    }
  }
})
