import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const allowedHosts = ["https://wms.v3rii.com"];
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@react-three/drei')) {
            return 'drei-vendor';
          }

          if (id.includes('@react-three/fiber')) {
            return 'fiber-vendor';
          }

          if (id.includes('/three/')) {
            return 'three-core-vendor';
          }

          if (id.includes('@microsoft/signalr')) {
            return 'signalr-vendor';
          }

          if (id.includes('html5-qrcode')) {
            return 'scanner-vendor';
          }

          if (id.includes('@radix-ui')) {
            return 'radix-vendor';
          }

          if (id.includes('react-router') || id.includes('react-dom') || id.includes('react')) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: allowedHosts,
    host: "0.0.0.0",
  },
})
