import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { seoPlugin } from './src/seo'

export default defineConfig({
  plugins: [react(), seoPlugin()],
  base: './',
})
