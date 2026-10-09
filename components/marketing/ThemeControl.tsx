"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import styles from "./marketing.module.css"

type Preference = "system" | "light" | "dark"
const key = "klk_landing_theme"
const eventName = "klk-landing-theme"
const query = "(prefers-color-scheme: dark)"

function apply(preference: Preference) {
  const root = document.documentElement
  root.dataset.landingPreference = preference
  root.dataset.landingTheme = preference === "system" ? (matchMedia(query).matches ? "dark" : "light") : preference
}

function subscribe(onChange: () => void) {
  const media = matchMedia(query)
  const systemChanged = () => {
    if (document.documentElement.dataset.landingPreference === "system") apply("system")
    onChange()
  }
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return
    apply(event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system")
    onChange()
  }
  media.addEventListener("change", systemChanged)
  window.addEventListener("storage", storageChanged)
  window.addEventListener(eventName, onChange)
  // Catch a system change between the head script and hydration.
  systemChanged()
  return () => {
    media.removeEventListener("change", systemChanged)
    window.removeEventListener("storage", storageChanged)
    window.removeEventListener(eventName, onChange)
  }
}

const snapshot = () => `${document.documentElement.dataset.landingPreference}:${document.documentElement.dataset.landingTheme}`
const serverSnapshot = () => ""

export function ThemeControl({ system = false }: { system?: boolean }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const isDark = theme.endsWith(":dark")
  const isSystem = theme.startsWith("system:")
  const label = system
    ? "Ikuti tema sistem"
    : (isDark ? "Gunakan tema terang" : "Gunakan tema gelap")

  const change = () => {
    const preference = system ? "system" : isDark ? "light" : "dark"
    apply(preference)
    try {
      if (preference === "system") localStorage.removeItem(key)
      else localStorage.setItem(key, preference)
    } catch { /* The current page still switches when storage is unavailable. */ }
    window.dispatchEvent(new Event(eventName))
  }

  return (
    <button type="button" onClick={change} disabled={!theme} className={system ? styles.themeSystem : styles.themeToggle}
      aria-label={label} title={label} aria-pressed={system ? isSystem : isDark}>
      {system ? <><Monitor size={14} aria-hidden="true" />{label}</> : <>
        <Sun className={styles.themeSun} size={17} aria-hidden="true" />
        <Moon className={styles.themeMoon} size={17} aria-hidden="true" />
      </>}
    </button>
  )
}
