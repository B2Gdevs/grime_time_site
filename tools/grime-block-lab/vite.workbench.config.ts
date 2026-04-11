import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = process.cwd();
const defaultPort = Number(process.env.WORKBENCH_VITE_PORT ?? "3173");

export default defineConfig({
  appType: "spa",
  plugins: [react()],
  root: projectRoot,
  base: "/__workbench_hmr/",
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  server: {
    host: "127.0.0.1",
    port: Number.isFinite(defaultPort) ? defaultPort : 3173,
    strictPort: true,
    // Keep websocket path under the same proxy prefix.
    hmr: {
      path: "/__workbench_hmr/__vite_ws",
    },
  },
});
