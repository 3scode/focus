import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { Providers } from "./providers"
import { AmbientBackground } from "@/components/layout/AmbientBackground"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Time Blocking",
  description: "Simple, visual time blocking for daily planning",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Time Blocking",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#3b82f6" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/today"
      signUpForceRedirectUrl="/today"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: "#5E6AD2",
          colorBackground: "#050506",
          colorForeground: "#EDEDEF",
          colorInput: "rgba(255,255,255,0.03)",
          colorInputForeground: "#EDEDEF",
          colorNeutral: "#8A8F98",
          borderRadius: "8px",
        },
      }}
    >
      <html lang="id" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          <AmbientBackground />
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
