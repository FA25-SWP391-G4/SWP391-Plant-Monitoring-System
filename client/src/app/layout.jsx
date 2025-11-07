'use client'

// Clean imports to prevent syntax issues
import { ThemeProvider as NextThemeProvider } from '@/components/theme-provider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals.css'
import { Toaster } from "@/components/ui/sonner"
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import AuthProvider from '@/providers/AuthProvider'
import { DashboardWidgetProvider } from '@/providers/DashboardWidgetProvider'
import GoogleHeadTags from '@/components/GoogleHeadTags'
import DashboardLayout from '@/components/DashboardLayout'
import { SettingsProvider } from '@/providers/SettingsProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleHeadTags />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <NextThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeProvider>
              <AuthProvider>
                <SettingsProvider>
                  <DashboardWidgetProvider>
                    <DashboardLayout>
                      {children}
                    </DashboardLayout>
                    <Toaster richColors position="top-center" />
                  </DashboardWidgetProvider>
                </SettingsProvider>
              </AuthProvider>
            </ThemeProvider>
          </NextThemeProvider>
        </I18nextProvider>
      </body>
    </html>
  )
}