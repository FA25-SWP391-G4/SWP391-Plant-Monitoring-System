'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { MqttProvider } from '../../contexts/MqttContext';
import MqttIntegrationDemo from '../../components/MqttIntegrationDemo';

/**
 * MQTT Demo Page
 * Showcases MQTT integration features for AI components
 */
export default function MqttDemoPage() {
  return (
    <MqttProvider>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            MQTT Integration Demo
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Test and monitor real-time MQTT communication for AI features
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This demo showcases the MQTT client integration for AI features including 
            chatbot responses, disease detection analysis, and irrigation predictions.
          </Typography>
        </Box>
        
        <MqttIntegrationDemo />
      </Container>
    </MqttProvider>
  );
}