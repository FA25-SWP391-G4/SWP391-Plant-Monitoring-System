import type React from "react"
import type { Metadata } from "next"
import { UserProvider } from "@/app/context/user-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "PlantSmart - Smart Plant Care Made Simple",
  description: "Join PlantSmart for personalized plant care insights and expert guidance",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>  {/* ✅ Bọc toàn app */}
      </body>
    </html>
  )
}
