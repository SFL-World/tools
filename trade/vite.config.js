import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://sfl.world",
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
