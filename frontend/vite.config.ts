import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      host: '0.0.0.0', // This exposes the server to your network
      port: 5173,      // (Optional) Explicitly set the port
    }
    // ⬆️ END CONFIGURATION BLOCK ⬆️
  })