import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    sourcemap: true, // or false if you don't need sourcemaps
  },
  base: "/chimney/",
});
