// The browser always talks to the frontend's own origin; Next.js rewrites
// (see next.config.ts) proxy /api/* to the real backend server-side. This
// keeps auth cookies first-party, so browsers that block third-party cookies
// (incognito, Safari) can stay logged in.
export const backendOrigin = ""

export const apiBaseUrl = "/api"
