import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // The API address is baked into the bundle at build time. src/services/http.ts
  // falls back to http://localhost:5001 when the variable is absent — right for
  // `vite dev`, and a silent wrong host in a production bundle. So a build
  // without the variable is refused here. Empty string is a valid value: it
  // means same origin as the page (the reverse proxy routes /api to the API).
  if (command === "build" && process.env.VITE_API_BASE_URL === undefined) {
    throw new Error(
      "Refusing to build: VITE_API_BASE_URL is not set. Use \"\" for same-origin " +
        "(behind the reverse proxy) or the API's https:// origin.",
    );
  }

  return {
    // Where the built app is served from. "/" for dev and for a dedicated host;
    // "/admin/" when the reverse proxy serves the panel under a path (see
    // kehilapp-devops/docker/nginx/reverse-proxy.conf). Vite prefixes every
    // asset URL with it, and App.tsx reads it back as the router's basename,
    // so the two cannot disagree.
    base: process.env.VITE_BASE_PATH ?? "/",
    server: {
      port: 3001, // Set the port here
    },
    plugins: [react()],
  };
});
