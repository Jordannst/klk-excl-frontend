import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://klkinvoice.my.id", changeFrequency: "monthly", priority: 1 }]
}
