import React, { useState } from 'react';
import aiApi from '../api/aiApi';
import { 
  Box, Button, Card, CardContent, CircularProgress, 
  Typography, Alert, Paper, Divider, TextField
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const AIImageRecognition = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [plantType, setPlantType] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn một hình ảnh để phân tích');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (plantType) {
        formData.append('plant_type', plantType);
      }
      
      const response = await aiApi.analyzeImage(formData);
      
      // Handle authentication errors
      if (!response.success) {
        if (response.requiresLogin) {
          setError('Vui lòng đăng nhập để sử dụng tính năng phân tích hình ảnh.');
        } else if (response.requiresPremium) {
          setError('Cần nâng cấp tài khoản Premium để sử dụng tính năng phân tích hình ảnh.');
        } else {
          setError(response.error || 'Không thể phân tích hình ảnh. Vui lòng thử lại sau.');
        }
        return;
      }
      
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Không thể phân tích hình ảnh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PhotoCameraIcon color="primary" />
        Phân tích hình ảnh cây trồng
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Loại cây (tùy chọn)"
          variant="outlined"
          value={plantType}
          onChange={(e) => setPlantType(e.target.value)}
          placeholder="Nhập loại cây để cải thiện độ chính xác"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="outlined"
          component="label"
          startIcon={<ImageIcon />}
          fullWidth
          sx={{ mb: 2 }}
        >
          Chọn hình ảnh
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>
        
        {preview && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }} 
            />
          </Box>
        )}
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={analyzeImage}
          disabled={loading || !selectedFile}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
          fullWidth
        >
          {loading ? 'Đang phân tích...' : 'Phân tích hình ảnh'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {analysis && (
        <Box>
          <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kết quả phân tích
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tình trạng:</strong> {analysis.condition}
              </Typography>
              <Typography variant="body1">
                <strong>Mô tả:</strong> {analysis.description}
              </Typography>
            </CardContent>
          </Card>
          
          {analysis.issues && analysis.issues.length > 0 && (
            <Card sx={{ mb: 2, bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vấn đề phát hiện
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {analysis.issues.map((issue, index) => (
                    <Typography component="li" key={index} variant="body1">
                      {issue}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Đề xuất
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

export default AIImageRecognition;