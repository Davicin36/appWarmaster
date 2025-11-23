import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { fileURLToPath } from 'url'

// 🔹 Obtener la ruta base de src en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Ahora "@/funciones/..." funciona
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000' // Ajusta al puerto de tu backend
    }
  }
})
