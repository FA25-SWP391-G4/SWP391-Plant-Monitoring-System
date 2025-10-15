'use client';

import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import AIChatbot from '../../components/AIChatbot';

const AIChatPage = () => {
  const [selectedPlant, setSelectedPlant] = useState(1);
  const [showSensorData, setShowSensorData] = useState(true);
  const [showSessionHistory, setShowSessionHistory] = useState(true);
  const [chatHeight, setChatHeight] = useState('600px');

  // Mock plant data
  const plants = [
    { id: 1, name: 'Cây cảnh phòng khách', type: 'Cây cảnh' },
    { id: 2, name: 'Cây thảo dược', type: 'Cây thuốc' },
    { id: 3, name: 'Cây hoa hồng', type: 'Cây hoa' }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Chat Interface Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Giao diện chat AI tích hợp với MQTT real-time, quản lý phiên chat, và hiển thị dữ liệu cảm biến.
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cấu hình Demo
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chọn cây</InputLabel>
              <Select
                value={selectedPlant}
                label="Chọn cây"
                onChange={(e) => setSelectedPlant(e.target.value)}
              >
                {plants.map((plant) => (
                  <MenuItem key={plant.id} value={plant.id}>
                    {plant.name} ({plant.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chiều cao chat</InputLabel>
              <Select
                value={chatHeight}
                label="Chiều cao chat"
                onChange={(e) => setChatHeight(e.target.value)}
              >
                <MenuItem value="400px">Nhỏ (400px)</MenuItem>
                <MenuItem value="600px">Trung bình (600px)</MenuItem>
                <MenuItem value="800px">Lớn (800px)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={showSensorData}
                  onChange={(e) => setShowSensorData(e.target.checked)}
                />
              }
              label="Hiển thị dữ liệu cảm biến"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={showSessionHistory}
                  onChange={(e) => setShowSessionHistory(e.target.checked)}
                />
              }
              label="Hiển thị lịch sử phiên chat"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Tính năng:</strong>
                <br />• MQTT real-time messaging
                <br />• Typing indicators
                <br />• Session management
                <br />• Sensor data integration
                <br />• Connection status
                <br />• Message confidence scores
              </Typography>
            </Alert>
          </Paper>

          {/* Connection Status */}
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Trạng thái kết nối
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">MQTT Broker:</Typography>
                <Typography variant="body2" color="success.main">
                  Đang kết nối...
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">AI Service:</Typography>
                <Typography variant="body2" color="success.main">
                  Hoạt động
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Sensor Data:</Typography>
                <Typography variant="body2" color="success.main">
                  Đang cập nhật
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <AIChatbot
            userId={1}
            plantId={selectedPlant}
            height={chatHeight}
            showSensorData={showSensorData}
            showSessionHistory={showSessionHistory}
          />
        </Grid>
      </Grid>

      {/* Feature Documentation */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tính năng đã triển khai
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              ✅ Responsive Chat UI
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Giao diện chat responsive với typing indicators và auto-scroll
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              ✅ MQTT Real-time Updates
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tích hợp MQTT cho real-time messaging và typing indicators
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              ✅ Sensor Data Display
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hiển thị dữ liệu cảm biến trong context chat với status indicators
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              ✅ Session Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Quản lý phiên chat với lịch sử và khả năng tạo phiên mới
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              ✅ Connection Status
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hiển thị trạng thái kết nối MQTT và sensor data
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              ✅ Error Handling
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Xử lý lỗi graceful với fallback responses và retry logic
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AIChatPage;