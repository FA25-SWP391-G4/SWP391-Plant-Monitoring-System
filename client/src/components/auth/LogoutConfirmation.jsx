import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

/**
 * LogoutConfirmation component
 * Confirms user wants to log out
 */
export function LogoutConfirmation({ onConfirm, onCancel }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // In a real implementation, this would call the logout API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call the onConfirm callback
      if (onConfirm) {
        onConfirm();
      } else {
        // Default behavior - redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            {/* Logout icon representation */}
            <span className="text-red-700 text-xl">⚠️</span>
          </span>
        </div>
        <CardTitle className="text-center text-2xl">Log out</CardTitle>
        <CardDescription className="text-center">
          Are you sure you want to log out?
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel || (() => window.history.back())}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Log out'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default LogoutConfirmation;