"use client"

import { useEffect } from "react"

export function LandingMotion() {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches || !("IntersectionObserver" in window)) return
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-landing-content] [data-reveal]"))
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute("data-reveal", "visible")
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" })

    // Never conceal content already on screen or reached through an anchor.
    for (const element of elements) {
      if (element.getBoundingClientRect().top < innerHeight) continue
      element.dataset.reveal = "pending"
      observer.observe(element)
    }
    const showAll = () => {
      observer.disconnect()
      for (const element of elements) element.dataset.reveal = "visible"
    }
    const preferenceChanged = () => { if (media.matches) showAll() }
    media.addEventListener("change", preferenceChanged)
    return () => {
      showAll()
      media.removeEventListener("change", preferenceChanged)
    }
  }, [])
  return null
}
