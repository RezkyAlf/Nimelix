import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "nimelix",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-28",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      ANIME_API_BASE_URL: bindings.text("https://api.otakudesu.natee.my.id/api/v1/anime"),
      ALLOWED_STREAM_HOSTS: bindings.text("www.blogger.com,odvidhide.com,mega.nz,pixeldrain.com"),
    },
  }),
});
