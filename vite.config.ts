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
          if (id.includes('/node_modules/@react-three/') || id.includes('/node_modules/three/')) {
            return 'vendor-3d';
          }

          if (id.includes('/node_modules/jspdf') || id.includes('/node_modules/jspdf-autotable') || id.includes('/node_modules/xlsx/')) {
            return 'vendor-export';
          }

          if (id.includes('/node_modules/bwip-js/')) {
            return 'vendor-barcode-render';
          }

          if (id.includes('/node_modules/konva/') || id.includes('/node_modules/react-konva/')) {
            return 'vendor-barcode-canvas';
          }

          if (id.includes('/node_modules/@microsoft/signalr/')) {
            return 'vendor-signalr';
          }

          if (id.includes('/src/features/inventory/3d-warehouse/')) {
            return 'warehouse-3d-feature';
          }

          // Let Rollup group third-party vendor modules naturally. The custom
          // vendor split was producing circular imports between vendor chunks
          // at runtime.
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
