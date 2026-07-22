import type { MetadataRoute } from "next";
import { COLOR_TEMA_PWA, DESCRIPCION_APP, NOMBRE_APP } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOMBRE_APP,
    short_name: NOMBRE_APP,
    description: DESCRIPCION_APP,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: COLOR_TEMA_PWA,
    theme_color: COLOR_TEMA_PWA,
    lang: "es",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
