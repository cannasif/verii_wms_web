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
