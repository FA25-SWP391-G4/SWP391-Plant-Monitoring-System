'use client';

import { SettingsProvider } from '@/providers/SettingsProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}