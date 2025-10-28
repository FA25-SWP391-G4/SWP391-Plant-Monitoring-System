/**
 * AI Features Page
 * Premium AI-powered plant care features and insights
 */
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import DashboardLayout from '../../components/DashboardLayout';
import PremiumAISection from '../../components/PremiumAISectionSimple';
import ThemedLoader from '../../components/ThemedLoader';
import { Box, Container, Typography, Card, CardContent, Button, Avatar } from 'lucide-react';
import { Star as StarIcon } from 'lucide-react'

const AIPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isPremium = user?.role === 'Premium' || user?.role === 'Admin';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <ThemedLoader size="lg" showText={true} text="Loading AI features..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Premium upgrade prompt for non-premium users
  const PremiumUpgradePrompt = () => (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ textAlign: 'center', p: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Avatar sx={{ mx: 'auto', mb: 3, bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 80 }}>
          <StarIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          AI Plant Care Assistant
        </Typography>
        <Typography variant="h6" paragraph sx={{ opacity: 0.9 }}>
          Unlock the power of artificial intelligence for your plants
        </Typography>
        <Box sx={{ my: 4 }}>
          <Typography variant="body1" paragraph>
            🤖 <strong>AI Chatbot:</strong> 24/7 plant care assistance and expert advice
          </Typography>
          <Typography variant="body1" paragraph>
            📸 <strong>Image Analysis:</strong> Disease detection and health assessment from photos
          </Typography>
          <Typography variant="body1" paragraph>
            📊 <strong>Smart Analytics:</strong> AI-powered insights and growth predictions
          </Typography>
          <Typography variant="body1" paragraph>
            💧 <strong>Watering Intelligence:</strong> Predictive watering schedules and recommendations
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          size="large" 
          sx={{ 
            bgcolor: 'white', 
            color: 'primary.main',
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)'
            }
          }}
          onClick={() => router.push('/premium')}
        >
          Upgrade to Premium
        </Button>
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
          Join thousands of plant enthusiasts using AI for better plant care
        </Typography>
      </Card>
    </Container>
  );

  return (
    <DashboardLayout>
      <Container maxWidth="xl">
        {isPremium ? (
          <PremiumAISection />
        ) : (
          <PremiumUpgradePrompt />
        )}
      </Container>
    </DashboardLayout>
  );
};

export default AIPage;