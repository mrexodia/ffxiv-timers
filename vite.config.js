import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["**/*"],
      manifest: {
        name: "FFXIV Timers",
        short_name: "FFXIV Timers",
        description: "A simple app to track FFXIV timers",
        theme_color: "#ffffff",
        icons: [
          {
            src: "alarm-clock.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
        ],
        apple: {
          statusBarStyle: "black",
        }
      },
    }),
  ],
});
