import type { MetadataRoute } from "next";
import { RUTAS_PUBLICAS_SITEMAP, urlBaseSeo } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlBaseSeo();
  const ultimaModificacion = new Date();

  return RUTAS_PUBLICAS_SITEMAP.map(({ ruta, prioridad, frecuencia }) => ({
    url: `${base}${ruta}`,
    lastModified: ultimaModificacion,
    changeFrequency: frecuencia,
    priority: prioridad,
  }));
}
