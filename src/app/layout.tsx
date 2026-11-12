import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { SessionProvider } from "@/components/providers/SessionProvider"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cycregalos.cl"),
  title: {
    default: "Cyc Regalos - Regalos con Intención y Amor",
    template: "%s | Cyc Regalos",
  },
  description: "Encuentra el regalo perfecto para toda ocasión. Cajas de regalo personalizadas, papelería fina, desayunos sorpresa y detalles únicos en Chile.",
  keywords: ["regalos personalizados", "cajas de regalo", "desayunos sorpresa", "regalos chile", "papeleria", "tazones personalizados"],
  authors: [{ name: "Cyc Regalos" }],
  creator: "Cyc Regalos",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Cyc Regalos - Regalos con Intención y Amor",
    description: "Encuentra el regalo perfecto para toda ocasión. Cajas de regalo personalizadas, papelería fina, desayunos sorpresa y detalles únicos en Chile.",
    url: "https://cycregalos.cl",
    siteName: "Cyc Regalos",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Cyc Regalos Logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
