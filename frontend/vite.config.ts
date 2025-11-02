import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator';

// https://vite.dev/config/
export default defineConfig({
  plugins: 
  [
    react(),
    javascriptObfuscator({
      // Apply this plugin only on 'build'
      apply: 'build',

      // Options for javascript-obfuscator
      options: {
        // Makes the code compact
        compact: true,

        // Flattens the control flow, making it much harder to follow
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,

        // Injects "dead" code to confuse analysis
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,

        // Disables console.log output
        disableConsoleOutput: true,

        // Renames global variables (use with caution)
        renameGlobals: true,

        // Makes the code "self-defend" against formatting/beautifying
        selfDefending: true,

        // Moves all strings into an encoded array
        stringArray: true,
        stringArrayEncoding: ['base64'], // or 'rc4'
        stringArrayThreshold: 0.75,

        // Makes it harder to use the debugger
        debugProtection: true,
        },
    }),
  ],
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
});