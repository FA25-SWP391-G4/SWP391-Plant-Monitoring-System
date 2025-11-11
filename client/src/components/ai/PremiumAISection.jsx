/**
 * Premium AI Section Component
 * Comprehensive AI features section for premium users
 * Includes plant health analysis, image recognition, predictions, and insights
 */
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';
import aiApi from '../api/aiApi';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bot,
  Camera,
  BarChart3,
  TrendingUp,
  Bug,
  Leaf,
  Droplets,
  Sun,
  Thermometer,
  Upload,
  Calendar,
  History,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';

const PremiumAISection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [plantAnalysis, setPlantAnalysis] = useState(null);
  const [diseaseDetection, setDiseaseDetection] = useState(null);
  const [wateringPrediction, setWateringPrediction] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // Check if user has premium access
  const isPremium = user?.role === 'Premium' || user?.role === 'Admin';

  // Mock plant data for demonstration
  const [samplePlantData] = useState({
    plant_id: 1,
    sensor_data: [
      { temperature: 23.5, humidity: 0.65, soil_moisture: 0.45, light: 0.8, timestamp: new Date() },
      { temperature: 24.1, humidity: 0.62, soil_moisture: 0.42, light: 0.75, timestamp: new Date(Date.now() - 3600000) },
      { temperature: 22.8, humidity: 0.68, soil_moisture: 0.48, light: 0.82, timestamp: new Date(Date.now() - 7200000) }
    ]
  });

  // Tab panels
  const tabPanels = [
    { 
      label: t('ai.section.tabs.analysis', 'Plant Analysis'), 
      icon: <AnalyticsIcon />,
      value: 0 
    },
    { 
      label: t('ai.section.tabs.imageRecognition', 'Image Recognition'), 
      icon: <CameraIcon />,
      value: 1 
    },
    { 
      label: t('ai.section.tabs.predictions', 'Predictions'), 
      icon: <TrendingUpIcon />,
      value: 2 
    },
    { 
      label: t('ai.section.tabs.history', 'Analysis History'), 
      icon: <HistoryIcon />,
      value: 3 
    },
  ];

  // Handle file upload
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, []);

  // Plant health analysis
  const runPlantAnalysis = async () => {
    setLoading(true);
    try {
      const response = await aiApi.analyzePlant(samplePlantData);
      setPlantAnalysis(response.data);
    } catch (error) {
      console.error('Plant analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image analysis
  const analyzeImage = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const healthResponse = await aiApi.analyzeHealth(selectedFile);
      const diseaseResponse = await aiApi.detectDisease(selectedFile);
      
      setAnalysisResults({
        health: healthResponse.data,
        disease: diseaseResponse.data
      });
    } catch (error) {
      console.error('Image analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Watering prediction
  const getWateringPrediction = async () => {
    setLoading(true);
    try {
      const response = await aiApi.predictWatering({
        plant_id: 1,
        days: 7
      });
      setWateringPrediction(response.data);
    } catch (error) {
      console.error('Watering prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get analysis history
  const fetchAnalysisHistory = async () => {
    setLoading(true);
    try {
      const response = await aiApi.getAnalysisHistory(1);
      setAnalysisHistory(response.data || []);
    } catch (error) {
      console.error('Analysis history error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Health score color
  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return <CheckIcon color="success" />;
      case 'concerning': return <WarningIcon color="warning" />;
      case 'critical': return <BugIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  // Render premium upgrade prompt
  const renderPremiumPrompt = () => (
    <Card sx={{ textAlign: 'center', p: 4 }}>
      <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 64, height: 64 }}>
        <StarIcon sx={{ fontSize: 32 }} />
      </Avatar>
      <Typography variant="h5" gutterBottom>
        {t('ai.section.premiumRequired.title', 'Premium Feature')}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('ai.section.premiumRequired.description', 'Unlock advanced AI plant care features with Premium')}
      </Typography>
      <Button variant="contained" color="primary" size="large">
        {t('ai.section.premiumRequired.upgrade', 'Upgrade to Premium')}
      </Button>
    </Card>
  );

  // Auto-run analysis on mount
  useEffect(() => {
    if (isPremium && activeTab === 0) {
      runPlantAnalysis();
    }
  }, [isPremium, activeTab]);

  // Load history when tab changes
  useEffect(() => {
    if (isPremium && activeTab === 3) {
      fetchAnalysisHistory();
    }
  }, [isPremium, activeTab]);

  if (!isPremium) {
    return renderPremiumPrompt();
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          {t('ai.section.title', 'AI Plant Care Assistant')}
          <Chip label="Premium" color="primary" size="small" />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('ai.section.subtitle', 'Advanced AI-powered plant care insights and recommendations')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabPanels.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {/* Plant Analysis Tab */}
      {activeTab === 0 && (
        <Fade in timeout={300}>
          <Box>
            <Grid container spacing={3}>
              {/* Overall Health Score */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EcoIcon />
                      </Avatar>
                    }
                    title={t('ai.section.analysis.healthScore', 'Overall Health')}
                    action={
                      <Tooltip title={t('ai.section.analysis.refresh', 'Refresh Analysis')}>
                        <IconButton onClick={runPlantAnalysis} disabled={loading}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent>
                    {loading ? (
                      <CircularProgress />
                    ) : plantAnalysis ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h2" color={`${getHealthScoreColor(plantAnalysis.health_score)}.main`}>
                          {Math.round(plantAnalysis.health_score)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={plantAnalysis.health_score}
                          color={getHealthScoreColor(plantAnalysis.health_score)}
                          sx={{ mt: 2, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ) : (
                      <Button onClick={runPlantAnalysis} variant="outlined" fullWidth>
                        {t('ai.section.analysis.analyze', 'Analyze Plant')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Detailed Analysis */}
              {plantAnalysis && (
                <>
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardHeader title={t('ai.section.analysis.details', 'Detailed Analysis')} />
                      <CardContent>
                        <Grid container spacing={2}>
                          {Object.entries(plantAnalysis.analysis).map(([key, data]) => (
                            <Grid item xs={12} sm={6} key={key}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {key === 'soil_moisture' && <WaterIcon color="primary" sx={{ mr: 1 }} />}
                                  {key === 'temperature' && <TempIcon color="primary" sx={{ mr: 1 }} />}
                                  {key === 'humidity' && <WaterIcon color="primary" sx={{ mr: 1 }} />}
                                  {key === 'light' && <LightIcon color="primary" sx={{ mr: 1 }} />}
                                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                    {key.replace('_', ' ')}
                                  </Typography>
                                  {getStatusIcon(data.status)}
                                </Box>
                                <Typography variant="h4" color={`${getHealthScoreColor(data.score)}.main`}>
                                  {Math.round(data.score)}%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {data.recommendation}
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Image Recognition Tab */}
      {activeTab === 1 && (
        <Fade in timeout={300}>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title={t('ai.section.imageAnalysis.upload', 'Upload Plant Image')} />
                  <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      {previewUrl ? (
                        <Box>
                          <img
                            src={previewUrl}
                            alt="Plant preview"
                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                          />
                          <Box sx={{ mt: 2 }}>
                            <input
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="image-upload"
                              type="file"
                              onChange={handleFileSelect}
                            />
                            <label htmlFor="image-upload">
                              <Button variant="outlined" component="span" sx={{ mr: 2 }}>
                                {t('ai.section.imageAnalysis.changeImage', 'Change Image')}
                              </Button>
                            </label>
                            <Button
                              variant="contained"
                              onClick={analyzeImage}
                              disabled={loading}
                              startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                            >
                              {loading ? t('ai.section.imageAnalysis.analyzing', 'Analyzing...') : t('ai.section.imageAnalysis.analyze', 'Analyze')}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 80, height: 80 }}>
                            <UploadIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="image-upload"
                            type="file"
                            onChange={handleFileSelect}
                          />
                          <label htmlFor="image-upload">
                            <Button variant="contained" component="span" size="large">
                              {t('ai.section.imageAnalysis.selectImage', 'Select Plant Image')}
                            </Button>
                          </label>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {analysisResults && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title={t('ai.section.imageAnalysis.results', 'Analysis Results')} />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {t('ai.section.imageAnalysis.healthAssessment', 'Health Assessment')}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Health: {Math.round(analysisResults.health?.health_assessment?.overall_health || 0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={analysisResults.health?.health_assessment?.overall_health || 0}
                          sx={{ mt: 1, mb: 2 }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="h6" gutterBottom>
                        {t('ai.section.imageAnalysis.diseaseDetection', 'Disease Detection')}
                      </Typography>
                      {analysisResults.disease?.health_assessment?.disease_detection ? (
                        <Alert severity="warning">
                          <AlertTitle>{t('ai.section.imageAnalysis.diseaseFound', 'Disease Detected')}</AlertTitle>
                          {t('ai.section.imageAnalysis.diseaseMessage', 'Potential disease detected. Please consult a plant specialist.')}
                        </Alert>
                      ) : (
                        <Alert severity="success">
                          <AlertTitle>{t('ai.section.imageAnalysis.noDiseaseFound', 'No Disease Detected')}</AlertTitle>
                          {t('ai.section.imageAnalysis.healthyMessage', 'Your plant appears healthy!')}
                        </Alert>
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {t('ai.section.imageAnalysis.recommendations', 'Recommendations')}
                        </Typography>
                        <List dense>
                          {(analysisResults.health?.recommendations || []).map((rec, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText primary={rec} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Predictions Tab */}
      {activeTab === 2 && (
        <Fade in timeout={300}>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title={t('ai.section.predictions.watering', 'Watering Predictions')}
                    action={
                      <Button
                        variant="contained"
                        onClick={getWateringPrediction}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <ScheduleIcon />}
                      >
                        {loading ? t('ai.section.predictions.predicting', 'Predicting...') : t('ai.section.predictions.predict', 'Generate Predictions')}
                      </Button>
                    }
                  />
                  <CardContent>
                    {wateringPrediction ? (
                      <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <AlertTitle>{t('ai.section.predictions.nextWatering', 'Next Watering')}</AlertTitle>
                          {wateringPrediction.next_watering || t('ai.section.predictions.noWateringNeeded', 'No watering needed in the next 7 days')}
                        </Alert>

                        <Typography variant="h6" gutterBottom>
                          {t('ai.section.predictions.weeklyForecast', 'Weekly Forecast')}
                        </Typography>
                        <Grid container spacing={2}>
                          {(wateringPrediction.predictions || []).map((prediction, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="subtitle1">
                                  {new Date(prediction.date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="h4" color={prediction.watering_recommended ? 'primary.main' : 'text.secondary'}>
                                  {prediction.watering_recommended ? <WaterIcon /> : '✓'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {Math.round(prediction.soil_moisture_prediction * 100)}% moisture
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {Math.round(prediction.confidence * 100)}% confidence
                                </Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 64, height: 64 }}>
                          <TrendingUpIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          {t('ai.section.predictions.noPredictions', 'No Predictions Available')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('ai.section.predictions.generateMessage', 'Generate AI predictions for your plants')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Analysis History Tab */}
      {activeTab === 3 && (
        <Fade in timeout={300}>
          <Box>
            <Card>
              <CardHeader
                title={t('ai.section.history.title', 'Analysis History')}
                action={
                  <Button
                    variant="outlined"
                    onClick={fetchAnalysisHistory}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                  >
                    {t('ai.section.history.refresh', 'Refresh')}
                  </Button>
                }
              />
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : analysisHistory.length > 0 ? (
                  <List>
                    {analysisHistory.map((analysis, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => {
                          setSelectedAnalysis(analysis);
                          setShowAnalysisDialog(true);
                        }}
                      >
                        <ListItemIcon>
                          <AnalyticsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Analysis #${index + 1}`}
                          secondary={new Date(analysis.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.300', width: 64, height: 64 }}>
                      <HistoryIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {t('ai.section.history.noHistory', 'No Analysis History')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('ai.section.history.noHistoryMessage', 'Run some analyses to see your history here')}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Fade>
      )}

      {/* Analysis Details Dialog */}
      <Dialog
        open={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('ai.section.history.analysisDetails', 'Analysis Details')}
          <IconButton
            aria-label="close"
            onClick={() => setShowAnalysisDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAnalysis && (
            <Box>
              <Typography variant="body1">
                {JSON.stringify(selectedAnalysis, null, 2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalysisDialog(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PremiumAISection;