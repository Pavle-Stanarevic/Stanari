import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use VITE_API_URL when available (set in frontend/.env, Docker or Render).
// Fallback to localhost for typical local dev (`npm run dev`).
const backendTarget = (process.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
