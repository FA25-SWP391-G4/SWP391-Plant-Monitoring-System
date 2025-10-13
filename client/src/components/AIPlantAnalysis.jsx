import React, { useState } from 'react';
import aiApi from '../api/aiApi';
import { useTranslation } from 'react-i18next';
import { 
  Box, Button, Card, CardContent, CircularProgress, 
  Grid, TextField, Typography, Alert, Paper, Divider
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import WarningIcon from '@mui/icons-material/Warning';
import RecommendIcon from '@mui/icons-material/Recommend';

const AIPlantAnalysis = ({ plantId, plantType, sensorData }) => {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Analyze plant condition using AI
  const analyzePlant = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiApi.analyzePlant({
        plant_id: plantId,
        plant_type: plantType,
        sensor_data: sensorData || {
          soil_moisture: 35,
          temperature: 28,
          humidity: 65,
          light_intensity: 800,
          ph_level: 6.2,
          nutrient_level: 450
        }
      });
      
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error analyzing plant:', err);
      setError(t('errors.analysisError', 'Could not analyze plant condition. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon color="primary" />
        {t('ai.plantAnalysis', 'Smart Plant Analysis')}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={analyzePlant}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
          fullWidth
        >
          {loading ? t('ai.analyzing', 'Analyzing...') : t('ai.analyzePlant', 'Analyze Plant Condition')}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {analysis && (
        <Box>
          <Card sx={{ mb: 2, bgcolor: analysis.overall_health === 'Tốt' ? 'success.light' : 
                                      analysis.overall_health === 'Trung bình' ? 'warning.light' : 'error.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('ai.overallCondition', 'Overall Condition')}: {
                  analysis.overall_health === 'Tốt' ? t('ai.good', 'Good') : 
                  analysis.overall_health === 'Trung bình' ? t('ai.moderate', 'Moderate') : 
                  t('ai.poor', 'Poor')
                }
              </Typography>
              <Typography variant="body1">
                {analysis.health_description}
              </Typography>
            </CardContent>
          </Card>
          
          {analysis.warnings && analysis.warnings.length > 0 && (
            <Card sx={{ mb: 2, bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  {t('ai.warnings', 'Warnings')}
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {analysis.warnings.map((warning, index) => (
                    <Typography component="li" key={index} variant="body1">
                      {warning}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RecommendIcon color="info" />
                {t('ai.careRecommendations', 'Care Recommendations')}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {analysis.recommendations.map((recommendation, index) => (
                  <Typography component="li" key={index} variant="body1" sx={{ mb: 1 }}>
                    {recommendation}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Paper>
  );
};

export default AIPlantAnalysis;