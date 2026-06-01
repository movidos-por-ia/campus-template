import type { Metadata } from "next"
import { Alata, Montserrat } from "next/font/google"
import "./globals.css"

const alata = Alata({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alata",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Campus IA — Spot",
  description: "Plataforma exclusiva de IA para a equipe Spot. Aprenda a criar, implementar e gerir Agentes de IA que trabalham 24/7.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${alata.variable} ${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
