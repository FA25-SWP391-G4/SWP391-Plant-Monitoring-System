'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

/**
 * Auth callback handler for OAuth flows
 * This page receives the token and redirect path after successful OAuth authentication
 */
export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const redirect = params.get('redirect') || '/dashboard';
        const error = params.get('error');
        
        if (error) {
          setError(`Authentication error: ${error}`);
          toast.error(`Login failed: ${error}`);
          return;
        }
        
        if (!token) {
          setError('No authentication token provided');
          toast.error('Login failed: Missing authentication token');
          return;
        }
        
        // Decode the token to get user info (JWT payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = payload.user;
        
        // Store the token in auth context
        login(token, user);
        
        // Start countdown for automatic redirect
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              router.push(redirect);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error processing auth callback:', error);
        setError('Failed to process authentication response');
        toast.error('Login failed. Please try again.');
      }
    };
    
    processCallback();
  }, [login, router]);
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {error ? 'Authentication Failed' : 'Login Successful'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Return to Login
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p>Login successful! Redirecting you in {countdown} seconds...</p>
              </div>
              
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}