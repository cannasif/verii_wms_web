import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const allowedHosts = ["https://wms.v3rii.com"];
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          typeof warning.id === 'string' &&
          warning.id.includes('@microsoft/signalr/dist/esm/Utils.js')
        ) {
          return;
        }

        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('/src/features/inventory/3d-warehouse/')) {
            return 'warehouse-3d-feature';
          }

          if (id.includes('/src/features/goods-receipt/')) {
            return 'goods-receipt-feature';
          }

          if (id.includes('/src/features/transfer/')) {
            return 'transfer-feature';
          }

          if (id.includes('/src/features/shipment/')) {
            return 'shipment-feature';
          }

          if (id.includes('/src/features/package/')) {
            return 'package-feature';
          }

          if (id.includes('/src/features/warehouse/')) {
            return 'warehouse-feature';
          }

          if (id.includes('/src/features/access-control/')) {
            return 'access-control-feature';
          }

          if (id.includes('/src/locales/')) {
            return 'locale-messages';
          }

          if (id.includes('/src/routes/')) {
            return 'route-shell';
          }

          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-core-vendor';
          }

          if (
            id.includes('@tanstack/react-query') ||
            id.includes('/axios/') ||
            id.includes('/i18next/') ||
            id.includes('/react-i18next/') ||
            id.includes('/zustand/')
          ) {
            return 'app-core-vendor';
          }

          if (id.includes('@microsoft/signalr')) {
            return 'signalr-vendor';
          }

          if (id.includes('html5-qrcode')) {
            return 'scanner-vendor';
          }

          if (id.includes('/three/')) {
            return 'three-vendor';
          }

          if (id.includes('three-stdlib')) {
            return 'three-stdlib-vendor';
          }

          if (
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/drei')
          ) {
            return 'three-react-vendor';
          }

          if (
            id.includes('/jspdf/') ||
            id.includes('/jspdf-autotable/') ||
            id.includes('/xlsx/')
          ) {
            return 'export-vendor';
          }

          if (id.includes('@radix-ui')) {
            return 'radix-vendor';
          }
          
          return undefined;
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
