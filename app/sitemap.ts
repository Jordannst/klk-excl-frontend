import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return ["id", "en"].map((locale) => ({
    url: `https://klkinvoice.my.id/${locale}`,
    changeFrequency: "monthly", priority: 1,
    alternates: { languages: { id: "https://klkinvoice.my.id/id", en: "https://klkinvoice.my.id/en", "x-default": "https://klkinvoice.my.id" } },
  }))
}
