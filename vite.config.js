import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The QR scanner needs camera access, which browsers only grant on
// https:// or localhost. `npm run dev` serves on localhost (fine), and
// `npm run preview --host` lets you open the vote page on a phone over LAN.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
