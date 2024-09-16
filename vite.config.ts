import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path-browserify";

const dirname = path.dirname(import.meta.url);
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001, // Set the port here
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
      "@components": path.resolve(dirname, "src/components"),
      "@features": path.resolve(dirname, "src/features"),
      "@lib": path.resolve(dirname, "src/lib"),
      "@pages": path.resolve(dirname, "src/pages"),
      "@context": path.resolve(dirname, "src/context"),
      "@hooks": path.resolve(dirname, "src/hooks"),
      "@utils": path.resolve(dirname, "src/utils"),
      "@services": path.resolve(dirname, "src/services"),
      "@ui": path.resolve(dirname, "src/components/ui"),
      "@assets": path.resolve(dirname, "src/assets"),
      "@types": path.resolve(dirname, "src/types"),
      "@api": path.resolve(dirname, "src/api"),
      "@routes": path.resolve(dirname, "src/routes"),
      "@store": path.resolve(dirname, "src/store"),
      "@demo-data": path.resolve(dirname, "src/demo-data"),

      // ... add more aliases as needed. Dont forget to add it to the tsconfig as well
      // This line is configuring a replacement for module imports. Specifically, it tells Vite to replace any import of "./runtimeConfig" with "./runtimeConfig.browser".
      // This is often used when you have different runtime configurations for different environments (e.g. browser, server). By replacing "./runtimeConfig" with "./runtimeConfig.browser", you can ensure that the correct configuration is used in the browser.
      find: "./runtimeConfig",
      replacement: "./runtimeConfig.browser",
    },
  },
});
