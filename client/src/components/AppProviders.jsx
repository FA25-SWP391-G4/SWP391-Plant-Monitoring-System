'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from "@/components/ui/sonner"
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n/i18n'
import AuthProvider from '@/providers/AuthProvider'

export default function AppProviders({ children }) {
  return (
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
  )
}