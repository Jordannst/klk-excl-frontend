export const locales = ["id", "en"] as const
export type LandingLocale = (typeof locales)[number]
export const localeCookie = "klk_landing_locale"

export function isLandingLocale(value: unknown): value is LandingLocale {
  return value === "id" || value === "en"
}

export function detectLandingLocale(preference?: string, country?: string | null, languages = ""): LandingLocale {
  if (isLandingLocale(preference)) return preference
  if (country && /^[A-Z]{2}$/.test(country) && country !== "XX") return country === "ID" ? "id" : "en"
  const candidates = languages.split(",").map((entry) => {
    const [tag, ...parameters] = entry.trim().toLowerCase().split(";")
    const weight = parameters.find((parameter) => parameter.trim().startsWith("q="))
    return { locale: tag.split("-")[0], quality: weight ? Number(weight.trim().slice(2)) : 1 }
  }).filter(({ locale, quality }) => isLandingLocale(locale) && quality > 0 && quality <= 1)
  candidates.sort((a, b) => b.quality - a.quality)
  return (candidates[0]?.locale as LandingLocale | undefined) ?? "en"
}
