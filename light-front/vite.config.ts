import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    AutoImport({
      imports: ["vue", "vue-router"],
      dts: "config/auto-import.d.ts",
    }),
    Components({
      dirs: ["src/components", "src/views"],
      extensions: ["vue"],
      dts: "config/components.d.ts",
      include: [/\.vue$/, /\.vue\?vue/],
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.nuxt[\\/]/,
      ],
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/dev-api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/dev-api/, ""),
      },
    },
  },
});
