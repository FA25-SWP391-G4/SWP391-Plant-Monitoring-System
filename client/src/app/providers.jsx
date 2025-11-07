'use client';

import { SettingsProvider } from '@/providers/SettingsProvider';
import { AuthProvider } from '@/providers/AuthProvider';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </AuthProvider>
  );
}