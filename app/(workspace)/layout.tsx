import type { Metadata } from "next"
import { Toaster } from "sonner"
import { Providers } from "../providers"
import { NavigationProgress } from "@/components/NavigationProgress"

export const metadata: Metadata = {
  title: "Aplikasi",
  robots: { index: false, follow: false },
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <Toaster position="top-right" richColors />
      <NavigationProgress />
    </Providers>
  )
}
