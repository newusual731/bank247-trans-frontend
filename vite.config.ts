import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Local nginx gateway — browser stays on :5174; Vite proxies API + Keycloak. */
const gateway = process.env.VITE_DEV_PROXY_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": { target: gateway, changeOrigin: true },
      "/realms": { target: gateway, changeOrigin: true },
      "/resources": { target: gateway, changeOrigin: true },
      "/health": { target: gateway, changeOrigin: true },
    },
  },
});
