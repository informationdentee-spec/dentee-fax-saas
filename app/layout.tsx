import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// タイポグラフィ要件: Inter（見出し: 600、本文: 400）
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RealEstate FAX",
  description: "不動産業務支援ツール",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
