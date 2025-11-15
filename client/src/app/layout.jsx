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
import DashboardLayout from '@/components/layout/DashboardLayout'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'
// Temporarily removing ChunkErrorBoundary and chunkErrorManager to fix app loading issue
// import ChunkErrorBoundary from '@/components/ChunkErrorBoundary'
 import { initializeChunkErrorManagement } from '@/utils/chunkErrorManager'
 import { useEffect } from 'react'
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary'

export default function RootLayout({ children }) {
  // Temporarily disabling chunk error management to fix app loading
  // Initialize chunk error management on app startup
   useEffect(() => {
     initializeChunkErrorManagement();
   }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleHeadTags />
      </head>
      <body>
        <ChunkErrorBoundary>
        {/* Temporarily removing ChunkErrorBoundary wrapper to fix import issue */}
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
                    <NotificationProvider>
                      <DashboardWidgetProvider>
                        <DashboardLayout>
                          {children}
                        </DashboardLayout>
                        <Toaster richColors position="top-center" />
                      </DashboardWidgetProvider>
                    </NotificationProvider>
                  </SettingsProvider>
                </AuthProvider>
              </ThemeProvider>
            </NextThemeProvider>
          </I18nextProvider>
        {/* Removed ChunkErrorBoundary closing tag */}
        </ChunkErrorBoundary>
      </body>
    </html>
  )
}