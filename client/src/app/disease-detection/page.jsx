'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DiseaseDetectionUI from '../../components/AIImageRecognition';
import MainLayout from '../../components/MainLayout';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  Home as HomeIcon,
  BugReport as BugReportIcon,
  Eco as EcoIcon
} from '@mui/icons-material';

const DiseaseDetectionPage = () => {
  const searchParams = useSearchParams();
  const plantId = searchParams.get('plantId');
  const plantName = searchParams.get('plantName');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage or context
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link 
            href="/dashboard" 
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            Dashboard
          </Link>
          {plantId && (
            <Link 
              href={`/plant-detail/${plantId}`}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <EcoIcon fontSize="small" />
              {plantName || `Cây #${plantId}`}
            </Link>
          )}
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <BugReportIcon fontSize="small" />
            Nhận diện Bệnh cây
          </Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BugReportIcon color="primary" sx={{ fontSize: 40 }} />
            Nhận diện Bệnh cây AI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Sử dụng trí tuệ nhân tạo để phát hiện bệnh cây qua hình ảnh và nhận được hướng dẫn điều trị
          </Typography>
          
          {plantId && plantName && (
            <Box sx={{ mt: 2 }}>
              <Chip 
                icon={<EcoIcon />}
                label={`Đang phân tích cho: ${plantName}`}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* Info Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🔍 Phát hiện chính xác
                </Typography>
                <Typography variant="body2">
                  AI được huấn luyện trên hàng nghìn ảnh bệnh cây, đạt độ chính xác cao trong việc nhận diện các bệnh phổ biến.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  💊 Hướng dẫn điều trị
                </Typography>
                <Typography variant="body2">
                  Nhận được phương pháp điều trị cụ thể và biện pháp phòng ngừa cho từng loại bệnh được phát hiện.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="info.main">
                  📊 Theo dõi lịch sử
                </Typography>
                <Typography variant="body2">
                  Lưu trữ và theo dõi lịch sử phân tích để theo dõi tình trạng sức khỏe cây trồng theo thời gian.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Usage Instructions */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Hướng dẫn sử dụng:
          </Typography>
          <Typography variant="body2" component="div">
            1. Chụp ảnh lá cây rõ nét, tập trung vào vùng có dấu hiệu bệnh<br/>
            2. Đảm bảo ánh sáng đầy đủ và ảnh không bị mờ<br/>
            3. Tải ảnh lên bằng cách kéo thả hoặc click chọn file<br/>
            4. Chờ AI phân tích và xem kết quả cùng hướng dẫn điều trị<br/>
            5. Đánh giá kết quả để giúp cải thiện độ chính xác của hệ thống
          </Typography>
        </Alert>

        {/* Main Disease Detection Component */}
        <DiseaseDetectionUI 
          plantId={plantId ? parseInt(plantId) : null}
          userId={user?.id || null}
        />

        {/* Additional Information */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Các bệnh được hỗ trợ
            </Typography>
            <Grid container spacing={1}>
              {[
                'Đốm lá',
                'Phấn trắng', 
                'Bệnh gỉ sắt',
                'Cháy lá do vi khuẩn',
                'Bệnh khảm virus',
                'Thiếu dinh dưỡng',
                'Sâu hại',
                'Cây khỏe mạnh'
              ].map((disease, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={disease} 
                    variant="outlined" 
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Hệ thống sẽ tiếp tục được cập nhật để hỗ trợ thêm nhiều loại bệnh khác.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </MainLayout>
  );
};

export default DiseaseDetectionPage;