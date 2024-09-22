// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path-browserify";
// import { fileURLToPath, URL } from "url";

// // Simulate __dirname using fileURLToPath with Vite's ES module syntax
// const __dirname = fileURLToPath(new URL(".", import.meta.url));
// // https://vitejs.dev/config/
// export default defineConfig({
//   server: {
//     port: 3001, // Set the port here
//   },
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": "src",
//       "@components": "src/components",
//       "@features": path.resolve(__dirname, "src/features"),
//       "@lib": path.resolve(__dirname, "src/lib"),
//       "@pages": path.resolve(__dirname, "src/pages"),
//       "@context": path.resolve(__dirname, "src/context"),
//       "@hooks": path.resolve(__dirname, "src/hooks"),
//       "@utils": path.resolve(__dirname, "src/utils"),
//       "@services": "src/services",
//       "@ui": "src/components/ui",
//       "@assets": path.resolve(__dirname, "src/assets"),
//       "@types": path.resolve(__dirname, "src/types"),
//       "@api": path.resolve(__dirname, "src/api"),
//       "@routes": path.resolve(__dirname, "src/routes"),
//       "@store": path.resolve(__dirname, "src/store"),
//       "@demo-data": path.resolve(__dirname, "src/demo-data"),

//       // ... add more aliases as needed. Dont forget to add it to the tsconfig as well
//       // This line is configuring a replacement for module imports. Specifically, it tells Vite to replace any import of "./runtimeConfig" with "./runtimeConfig.browser".
//       // This is often used when you have different runtime configurations for different environments (e.g. browser, server). By replacing "./runtimeConfig" with "./runtimeConfig.browser", you can ensure that the correct configuration is used in the browser.
//       find: "./runtimeConfig",
//       replacement: "./runtimeConfig.browser",
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001, // Set the port here
  },

  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@features": "/src/features",
      "@lib": "/src/lib",
      "@pages": "/src/pages",
      "@context": "/src/context",
      "@hooks": "/src/hooks",
      "@utils": "/src/utils",
      "@services": "/src/services",
      "@ui": "/src/components/ui",
      "@assets": "/src/assets",
      "@types": "/src/types",
      "@api": "/src/api",
      "@routes": "/src/routes",
      "@store": "/src/store",
      "@demo-data": "/src/demo-data",
    },
  },
});
