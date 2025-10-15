import React, { useState, useEffect, useCallback, useRef } from 'react';
import useDiseaseDetection from '../hooks/useDiseaseDetection';
import { useMqttContext } from '../contexts/MqttContext';
import MqttConnectionStatus from './MqttConnectionStatus';
import { 
  Box, Button, Card, CardContent, CircularProgress, 
  Typography, Alert, Paper, Divider, TextField, Chip,
  LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Rating, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Tooltip, Badge,
  List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Tabs, Tab, Grid, CardActions
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  BugReport as BugReportIcon,
  LocalHospital as LocalHospitalIcon,
  History as HistoryIcon,
  Feedback as FeedbackIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const DiseaseDetectionUI = ({ plantId, userId }) => {
  // Use custom hook for disease detection
  const {
    analysisHistory,
    supportedDiseases,
    loading,
    error: hookError,
    isConnected,
    analyzeDisease,
    submitFeedback,
    clearError,
    refreshData
  } = useDiseaseDetection(plantId, userId);

  // Local state management
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Refs
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Combine errors from hook and local state
  const error = hookError || localError;

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  // File selection handler
  const handleFileSelection = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLocalError('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setLocalError('Kích thước file không được vượt quá 10MB');
      return;
    }

    setSelectedFile(file);
    setLocalError(null);
    clearError();
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelection(file);
  };

  // Analyze disease with progress tracking
  const handleAnalyzeDisease = async () => {
    if (!selectedFile) {
      setLocalError('Vui lòng chọn một hình ảnh để phân tích');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);
    clearError();
    setProgress(0);
    setAnalysis(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await analyzeDisease(selectedFile);
      setProgress(100);
      setAnalysis(result);
    } catch (err) {
      console.error('Error analyzing disease:', err);
      setLocalError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLocalLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async (feedbackData) => {
    try {
      await submitFeedback(selectedAnalysis.analysisId, feedbackData);
      setFeedbackDialog(false);
      setSelectedAnalysis(null);
      // Show success message
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setLocalError('Không thể gửi feedback. Vui lòng thử lại.');
    }
  };

  // Clear current analysis
  const clearAnalysis = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysis(null);
    setLocalError(null);
    clearError();
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <ErrorIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReportIcon color="primary" />
        Nhận diện Bệnh cây
        {isConnected && (
          <Chip 
            label="Real-time" 
            color="success" 
            size="small" 
            sx={{ ml: 1 }}
          />
        )}
      </Typography>
      
      <Divider sx={{ my: 2 }} />

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Phân tích mới" icon={<PhotoCameraIcon />} />
        <Tab 
          label="Lịch sử" 
          icon={
            <Badge badgeContent={analysisHistory.length} color="primary">
              <HistoryIcon />
            </Badge>
          } 
        />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          {/* Drag and Drop Upload Area */}
          <Box
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${dragActive ? '#1976d2' : '#ccc'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              mb: 3,
              '&:hover': {
                borderColor: '#1976d2',
                bgcolor: 'action.hover'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
            
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {dragActive ? 'Thả ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hỗ trợ: JPEG, PNG, WebP (tối đa 10MB)
            </Typography>
          </Box>

          {/* Image Preview */}
          {preview && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Ảnh đã chọn</Typography>
                  <IconButton onClick={clearAnalysis} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={preview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleAnalyzeDisease}
                  disabled={localLoading || loading.analysis}
                  startIcon={(localLoading || loading.analysis) ? <CircularProgress size={20} color="inherit" /> : <BugReportIcon />}
                  fullWidth
                  size="large"
                >
                  {(localLoading || loading.analysis) ? 'Đang phân tích...' : 'Phân tích bệnh cây'}
                </Button>
              </CardActions>
            </Card>
          )}

          {/* Progress Bar */}
          {(localLoading || loading.analysis) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Đang xử lý ảnh và phân tích bệnh...
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Box>
              {/* Primary Disease Result */}
              <Card sx={{ mb: 3, border: `2px solid ${getSeverityColor(analysis.severity)}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {getSeverityIcon(analysis.severity)}
                    <Typography variant="h6">
                      Kết quả phân tích
                    </Typography>
                    <Chip 
                      label={`${Math.round(analysis.confidence * 100)}% tin cậy`}
                      color={analysis.confidence > 0.8 ? 'success' : analysis.confidence > 0.6 ? 'warning' : 'error'}
                    />
                  </Box>
                  
                  {analysis.primaryDisease && (
                    <Box>
                      <Typography variant="h6" color={getSeverityColor(analysis.severity)} gutterBottom>
                        {analysis.primaryDisease.disease.name}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {analysis.primaryDisease.disease.description}
                      </Typography>
                      
                      {analysis.severity && (
                        <Chip 
                          label={`Mức độ: ${analysis.severity === 'high' ? 'Nghiêm trọng' : 
                                           analysis.severity === 'medium' ? 'Trung bình' : 'Nhẹ'}`}
                          color={getSeverityColor(analysis.severity)}
                          sx={{ mb: 2 }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Treatment Recommendations */}
              {analysis.treatments && analysis.treatments.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalHospitalIcon color="primary" />
                      <Typography variant="h6">Phương pháp điều trị</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {analysis.treatments.map((treatment, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {index + 1}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={treatment} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Prevention Tips */}
              {analysis.prevention && analysis.prevention.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" />
                      <Typography variant="h6">Biện pháp phòng ngừa</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {analysis.prevention.map((tip, index) => (
                        <ListItem key={index}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'success.main' }}>
                              <CheckCircleIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={tip} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* All Detected Diseases */}
              {analysis.diseases && analysis.diseases.length > 1 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Tất cả bệnh phát hiện</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {analysis.diseases.map((disease, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                {disease.disease.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Tin cậy: {Math.round(disease.confidence * 100)}%
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Feedback Button */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<FeedbackIcon />}
                  onClick={() => {
                    setSelectedAnalysis(analysis);
                    setFeedbackDialog(true);
                  }}
                >
                  Đánh giá kết quả
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {/* Analysis History */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Lịch sử phân tích</Typography>
            <IconButton onClick={refreshData} disabled={loading.history}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {loading.history ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : analysisHistory.length === 0 ? (
            <Alert severity="info">
              Chưa có lịch sử phân tích nào cho cây này.
            </Alert>
          ) : (
            <List>
              {analysisHistory.map((historyItem, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {historyItem.result_data?.primaryDisease?.disease?.name || 'Phân tích không xác định'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {new Date(historyItem.created_at).toLocaleString('vi-VN')}
                        </Typography>
                        <Chip 
                          label={`${Math.round((historyItem.confidence_score || 0) * 100)}% tin cậy`}
                          size="small"
                          color={historyItem.confidence_score > 0.8 ? 'success' : 'warning'}
                        />
                      </Box>
                      {historyItem.image_path && (
                        <Box sx={{ ml: 2 }}>
                          <img 
                            src={`/api/ai/disease/image/${historyItem.image_path}?thumbnail=true`}
                            alt="Analysis"
                            style={{ 
                              width: 60, 
                              height: 60, 
                              objectFit: 'cover', 
                              borderRadius: 4 
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đánh giá kết quả phân tích</DialogTitle>
        <DialogContent>
          <FeedbackForm 
            analysis={selectedAnalysis}
            onSubmit={handleSubmitFeedback}
            onCancel={() => setFeedbackDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

// Feedback Form Component
const FeedbackForm = ({ analysis, onSubmit, onCancel }) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    onSubmit({
      feedbackType,
      userComment: comment,
      rating
    });
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Kết quả phân tích có chính xác không?
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        {['correct', 'partially_correct', 'incorrect'].map((type) => (
          <Button
            key={type}
            variant={feedbackType === type ? 'contained' : 'outlined'}
            onClick={() => setFeedbackType(type)}
            sx={{ mr: 1, mb: 1 }}
          >
            {type === 'correct' ? 'Chính xác' : 
             type === 'partially_correct' ? 'Một phần đúng' : 'Không chính xác'}
          </Button>
        ))}
      </Box>

      <Typography variant="subtitle1" gutterBottom>
        Đánh giá tổng thể:
      </Typography>
      <Rating
        value={rating}
        onChange={(event, newValue) => setRating(newValue)}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Nhận xét (tùy chọn)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel}>
          Hủy
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!feedbackType}
        >
          Gửi đánh giá
        </Button>
      </Box>
    </Box>
  );
};

export default DiseaseDetectionUI;