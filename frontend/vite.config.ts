import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import javascriptObfuscator from 'rollup-plugin-javascript-obfuscator';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
      host: '0.0.0.0', // This exposes the server to your network
      port: 5173,      // (Optional) Explicitly set the port
      allowedHosts: ['olymarket.net'],
     proxy: {
       '/profile': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/categories': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/groups': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/offers': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/community-discussions': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/admin': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/conversations': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/reports': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/analytics': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/announcements': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
       '/wanted-listings': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
      '/auth': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false, // set false only if tunnel uses a self-signed cert
      },
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
      '/listings': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  uild: {
    // use terser for more advanced mangling options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
      mangle: true,
    },
    // don't emit source maps for production
    sourcemap: false,
    rollupOptions: {
      plugins: [
        // run obfuscator as the last step (optional)
        javascriptObfuscator({
          // tune options; heavy options increase size and CPU time
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
        }, ['**/*.map.js']),
      ],
    },
  },
});