'use client'

// Clean imports to prevent syntax issues
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import AuthProvider from '@/providers/AuthProvider'
import GoogleHeadTags from '@/components/GoogleHeadTags'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <GoogleHeadTags />
      <body>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster richColors position="top-center" />
            </AuthProvider>
          </ThemeProvider>
        </I18nextProvider>
      </body>
    </html>
  )
}