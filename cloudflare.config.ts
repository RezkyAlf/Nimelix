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
      ALLOWED_STREAM_HOSTS: bindings.text("vsys-srv.berkasdrive.com,vsys-meledak.dlgan.my.id,www.blogger.com,filedon.co,odvidhide.com,video.sumantritelnologi.workers.dev"),
    },
  }),
});
