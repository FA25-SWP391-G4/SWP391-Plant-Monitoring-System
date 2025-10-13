'use client'

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ 
  error,
  reset 
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col">
          {/* Header */}
          <header className="w-full border-b border-emerald-100/60 bg-white/80 backdrop-blur-md">
            <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-leaf h-7 w-7 text-emerald-600 mr-2" aria-hidden="true">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                </svg>
                <span className="text-xl font-bold text-gray-900">PlantSmart</span>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex items-center justify-center">
            <div className="container mx-auto px-6 py-16 lg:py-24 text-center">
              <div className="mb-8 inline-flex items-center justify-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                </span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Critical Error</h1>
              <p className="text-xl text-gray-600 max-w-lg mx-auto mb-10">
                A serious error occurred in the application. Our team has been automatically notified 
                and is working on resolving it as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => reset()} 
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md">
                  Try Again
                </button>
                <a href="/" 
                  className="px-6 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
                  Return Home
                </a>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-emerald-100/60">
            <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between">
              <p className="text-sm text-gray-500">
                <span>© {new Date().getFullYear()} PlantSmart. All rights reserved.</span>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}