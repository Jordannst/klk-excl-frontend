"use client"

import { localeCookie, locales, type LandingLocale } from "@/lib/landing-locale"
import styles from "./marketing.module.css"

export function LanguageSwitcher({ locale }: { locale: LandingLocale }) {
  return (
    <nav className={styles.languageSwitcher} aria-label={locale === "id" ? "Pilih bahasa" : "Choose language"}>
      {locales.map((language) => (
        <a key={language} href={`/${language}`} hrefLang={language} lang={language}
          aria-label={language === "id" ? "Bahasa Indonesia" : "English"}
          aria-current={locale === language ? "page" : undefined}
          onClick={() => {
            document.cookie = `${localeCookie}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
          }}>
          {language.toUpperCase()}
        </a>
      ))}
    </nav>
  )
}
