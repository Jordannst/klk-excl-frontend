const DEFAULT_BACKEND_ORIGIN = "http://localhost:4000"

export const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_ORIGIN).replace(/\/api\/?$/, "")

export const apiBaseUrl = backendOrigin.endsWith("/api") ? backendOrigin : `${backendOrigin}/api`
