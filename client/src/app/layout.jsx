// Clean imports to prevent syntax issues
import './globals.css'
import GoogleHeadTags from '@/components/GoogleHeadTags'
import AppProviders from '@/components/AppProviders'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleHeadTags />
      </head>
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}