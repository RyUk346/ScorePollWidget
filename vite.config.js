import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// `base` controls the path the app is served under. Leave it "/" for local dev;
// set VITE_BASE_PATH=/hg_score_poll/ in .env to serve under a subpath on the
// VPS (must start and end with a slash). The router + QR read this automatically.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: { host: true, port: 5173 },
  };
});
