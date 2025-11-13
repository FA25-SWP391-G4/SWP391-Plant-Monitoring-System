import axiosClient from "./axiosClient";

const reportsApi = {
  // Get summary reports
  summary: (zoneId, from, to) => axiosClient.get("/reports/summary", { params: { zoneId, from, to } }),
  
  // Get time series data
  timeseries: (zoneId, from, to, metrics) => axiosClient.get("/reports/timeseries", { params: { zoneId, from, to, metrics } }),
  
  // Search reports
  search: (query) => axiosClient.get("/reports/search", { params: query }), // zoneId?, from?, to?, keyword?
  
  // Get comprehensive reports for dashboard
  getReports: async (timeRange = 'week') => {
    try {
      const response = await axiosClient.get('/api/reports', { params: { timeRange } });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      
      // Return mock data for development if API fails
      if (process.env.NODE_ENV === 'development') {
        return generateMockReportData(timeRange);
      }
      
      throw error;
    }
  },
  
  /**
   * Get historical sensor data for a specific plant
   * @param {number} plantId - Plant ID
   * @param {string} timeRange - Time range for the data (day, week, month, year)
   * @param {Array} metrics - Metrics to include (moisture, temperature, humidity, light)
   * @returns {Promise} - Historical sensor data
   */
  getHistoricalData: async (plantId, timeRange = 'week', metrics = []) => {
    try {
      const response = await axiosClient.get(`/api/reports/historical-data/${plantId}`, {
        params: { timeRange, metrics: metrics.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return generateMockHistoricalData(plantId, timeRange, metrics);
      }
      throw error;
    }
  },
  
  /**
   * Get water consumption data for a plant or all plants
   * @param {number} plantId - Plant ID, omit for all plants
   * @param {string} timeRange - Time range for the data (day, week, month, year)
   * @returns {Promise} - Water consumption data
   */
  getWaterConsumption: async (plantId, timeRange = 'month') => {
    try {
      const url = plantId 
        ? `/api/reports/water-consumption/${plantId}` 
        : '/api/reports/water-consumption';
        
      const response = await axiosClient.get(url, { params: { timeRange } });
      return response.data;
    } catch (error) {
      console.error('Error fetching water consumption data:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return generateMockWaterConsumption(plantId, timeRange);
      }
      throw error;
    }
  },
  
  /**
   * Get plant health data for a plant or all plants
   * @param {number} plantId - Plant ID, omit for all plants
   * @param {string} timeRange - Time range for the data (day, week, month, year)
   * @returns {Promise} - Plant health data
   */
  getPlantHealth: async (plantId, timeRange = 'month') => {
    try {
      const url = plantId 
        ? `/api/reports/plant-health/${plantId}` 
        : '/api/reports/plant-health';
        
      const response = await axiosClient.get(url, { params: { timeRange } });
      return response.data;
    } catch (error) {
      console.error('Error fetching plant health data:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return generateMockPlantHealth(plantId, timeRange);
      }
      throw error;
    }
  },
  
  /**
   * Get custom reports for the user
   * @returns {Promise} - Custom reports list
   */
  getCustomReports: async () => {
    try {
      const response = await axiosClient.get('/api/reports/custom');
      return response;
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      throw error;
    }
  },
  
  /**
   * Create a new custom report
   * @param {Object} reportData - Report configuration
   * @returns {Promise} - Created report
   */
  createCustomReport: async (reportData) => {
    try {
      const response = await axiosClient.post('/api/reports/custom', reportData);
      return response;
    } catch (error) {
      console.error('Error creating custom report:', error);
      throw error;
    }
  },
  
  /**
   * Run a custom report
   * @param {number} reportId - Report ID
   * @returns {Promise} - Report data
   */
  runCustomReport: async (reportId) => {
    try {
      const response = await axiosClient.post(`/api/reports/custom/${reportId}/run`);
      return response;
    } catch (error) {
      console.error('Error running custom report:', error);
      throw error;
    }
  },
  
  /**
   * Delete a custom report
   * @param {number} reportId - Report ID
   * @returns {Promise} - Success response
   */
  deleteCustomReport: async (reportId) => {
    try {
      const response = await axiosClient.delete(`/api/reports/custom/${reportId}`);
      return response;
    } catch (error) {
      console.error('Error deleting custom report:', error);
      throw error;
    }
  },
  
  /**
   * Get water consumption data for time range and plant filter
   * @param {string} timeRange - Time range (week, month, quarter, year)
   * @param {string} plantFilter - Plant filter ('all' or plant ID)
   * @returns {Promise} - Water consumption data
   */
  getWaterConsumption: async (timeRange = 'month', plantFilter = 'all') => {
    try {
      const response = await axiosClient.get('/api/reports/water-consumption', {
        params: { timeRange, plant: plantFilter }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching water consumption data:', error);
      throw error;
    }
  },
  
  /**
   * Get plant distribution data (types, locations, etc.)
   * @param {string} groupBy - How to group plants (type, location, age, etc.)
   * @returns {Promise} - Plant distribution data
   */
  getPlantDistribution: async (groupBy = 'type') => {
    try {
      const response = await axiosClient.get('/api/reports/plant-distribution', { 
        params: { groupBy } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching plant distribution data:', error);
      // Return mock data in development
      if (process.env.NODE_ENV === 'development') {
        return generateMockPlantDistribution(groupBy);
      }
      throw error;
    }
  }
};

// Generate mock data for development when API is not available
function generateMockReportData(timeRange) {
  // Generate appropriate number of data points based on time range
  const dataPoints = timeRange === 'day' ? 24 : 
                    timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 : 12;
  
  // Current date for reference
  const now = new Date();
  
  // Generate mock moisture data
  const moisture = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(now);
    date.setHours(date.getHours() - (timeRange === 'day' ? i : 0));
    date.setDate(date.getDate() - (timeRange !== 'day' ? i : 0));
    
    return {
      date: date.toISOString(),
      value: Math.floor(Math.random() * 30) + 40, // Random value between 40-70%
      name: 'Moisture'
    };
  }).reverse();
  
  // Generate temperature and humidity data
  const tempHumidity = [];
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - (timeRange === 'day' ? i : 0));
    date.setDate(date.getDate() - (timeRange !== 'day' ? i : 0));
    
    tempHumidity.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * 10) + 20, // 20-30°C
      name: 'Temperature'
    });
    
    tempHumidity.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * 20) + 50, // 50-70%
      name: 'Humidity'
    });
  }
  
  // Generate watering history data
  const watering = Array.from({ length: Math.ceil(dataPoints / 3) }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 3); // Water every 3 days
    
    return {
      date: date.toISOString(),
      amount: Math.floor(Math.random() * 100) + 200 // 200-300ml
    };
  }).reverse();
  
  // Generate health distribution data
  const healthDistribution = [
    { status: 'Healthy', count: Math.floor(Math.random() * 5) + 5 },
    { status: 'Needs Water', count: Math.floor(Math.random() * 3) + 1 },
    { status: 'Needs Attention', count: Math.floor(Math.random() * 2) + 1 }
  ];
  
  // Generate historical data
  const historicalData = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(now);
    date.setHours(date.getHours() - i * 6);
    
    return {
      timestamp: date.toISOString(),
      plant_name: ['Snake Plant', 'Peace Lily', 'Monstera', 'Aloe Vera'][i % 4],
      moisture: Math.floor(Math.random() * 30) + 40,
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 20) + 50,
      light: Math.floor(Math.random() * 5000) + 2000
    };
  });
  
  return {
    moisture,
    tempHumidity,
    watering,
    healthDistribution,
    historicalData
  };
}

// Generate mock historical data for a specific plant
function generateMockHistoricalData(plantId, timeRange, metrics = []) {
  // Generate appropriate number of data points based on time range
  const dataPoints = timeRange === 'day' ? 24 : 
                    timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 : 12;
  
  // Current date for reference
  const now = new Date();
  
  // Generate mock sensor readings
  const readings = [];
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now);
    date.setHours(date.getHours() - (timeRange === 'day' ? i * (24/dataPoints) : 0));
    date.setDate(date.getDate() - (timeRange !== 'day' ? i : 0));
    
    readings.push({
      timestamp: date.toISOString(),
      moisture: Math.floor(Math.random() * 30) + 40, // 40-70%
      temperature: Math.floor(Math.random() * 10) + 20, // 20-30°C
      humidity: Math.floor(Math.random() * 20) + 50, // 50-70%
      light: Math.floor(Math.random() * 5000) + 2000 // 2000-7000 lux
    });
  }
  
  // Sort by date
  readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Mock plant info
  const plantInfo = {
    id: plantId,
    name: ['Snake Plant', 'Peace Lily', 'Monstera', 'Aloe Vera'][plantId % 4],
    type: ['Indoor', 'Outdoor', 'Succulent', 'Tropical'][plantId % 4],
    location: ['Living Room', 'Kitchen', 'Bedroom', 'Balcony'][plantId % 4]
  };
  
  return {
    plant: plantInfo,
    readings,
    metrics: {
      averageMoisture: Math.floor(readings.reduce((sum, r) => sum + r.moisture, 0) / readings.length),
      averageTemperature: Math.floor(readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length),
      averageHumidity: Math.floor(readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length),
      averageLight: Math.floor(readings.reduce((sum, r) => sum + r.light, 0) / readings.length),
    }
  };
}

// Generate mock water consumption data
function generateMockWaterConsumption(plantId, timeRange) {
  // Generate appropriate number of data points based on time range
  const dataPoints = timeRange === 'day' ? 1 : 
                    timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 : 12;
  
  // Current date for reference
  const now = new Date();
  
  // Generate watering events
  const events = [];
  for (let i = 0; i < (dataPoints / 3); i++) { // Water every ~3 days
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 3));
    
    events.push({
      timestamp: date.toISOString(),
      amount: Math.floor(Math.random() * 150) + 150, // 150-300ml
      method: Math.random() > 0.7 ? 'Automatic' : 'Manual'
    });
  }
  
  // Generate daily consumption
  const dailyConsumption = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Find watering events for this day
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
    
    // Sum up water amounts for this day
    const dayTotal = dayEvents.reduce((sum, event) => sum + event.amount, 0);
    
    return {
      date: date.toISOString().split('T')[0],
      amount: dayTotal
    };
  }).filter(day => day.amount > 0); // Only include days with watering
  
  // Sort by date
  dailyConsumption.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Generate summary stats
  const totalConsumption = events.reduce((sum, e) => sum + e.amount, 0);
  const averagePerEvent = Math.round(totalConsumption / events.length);
  
  return {
    plantId: plantId,
    totalConsumption,
    averagePerEvent,
    wateringCount: events.length,
    autoWateringCount: events.filter(e => e.method === 'Automatic').length,
    manualWateringCount: events.filter(e => e.method === 'Manual').length,
    dailyConsumption,
    events
  };
}

// Generate mock plant health data
function generateMockPlantHealth(plantId, timeRange) {
  // Generate appropriate number of data points based on time range
  const dataPoints = timeRange === 'day' ? 1 : 
                    timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 4 : 12;
  
  // Current date for reference
  const now = new Date();
  
  // Generate health readings
  const healthReadings = Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date(now);
    if (timeRange === 'week') {
      date.setDate(date.getDate() - i);
    } else if (timeRange === 'month') {
      date.setDate(date.getDate() - (i * 7)); // Weekly for a month
    } else if (timeRange === 'year') {
      date.setMonth(date.getMonth() - i); // Monthly for a year
    }
    
    // Generate a score that generally improves over time
    // (more recent readings have higher scores to simulate improvement)
    const baseScore = 0.6 + ((dataPoints - i) / dataPoints * 0.3);
    const healthScore = Math.min(0.95, baseScore + (Math.random() * 0.1 - 0.05));
    
    return {
      date: date.toISOString().split('T')[0],
      health_score: parseFloat(healthScore.toFixed(2)),
      issues_detected: healthScore < 0.7 ? Math.floor(Math.random() * 3) + 1 : 
                      healthScore < 0.85 ? Math.floor(Math.random() * 2) : 0
    };
  });
  
  // Sort by date
  healthReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Latest reading
  const latestReading = healthReadings[healthReadings.length - 1];
  
  // Generate issues if any
  const issues = [];
  if (latestReading.issues_detected > 0) {
    const possibleIssues = [
      { name: 'Leaf Yellowing', severity: 'medium', description: 'Some leaves are turning yellow' },
      { name: 'Dry Soil', severity: 'high', description: 'Soil is too dry' },
      { name: 'Leaf Spots', severity: 'low', description: 'Small spots detected on leaves' },
      { name: 'Stunted Growth', severity: 'medium', description: 'Plant is growing slower than expected' },
      { name: 'Pest Detected', severity: 'high', description: 'Signs of pest infestation detected' }
    ];
    
    // Randomly select issues based on the number detected
    for (let i = 0; i < latestReading.issues_detected; i++) {
      issues.push(possibleIssues[Math.floor(Math.random() * possibleIssues.length)]);
    }
  }
  
  // Generate recommendations based on issues
  const recommendations = [];
  issues.forEach(issue => {
    if (issue.name === 'Leaf Yellowing') {
      recommendations.push('Check for nutrient deficiency');
      recommendations.push('Ensure proper light exposure');
    } else if (issue.name === 'Dry Soil') {
      recommendations.push('Increase watering frequency');
      recommendations.push('Consider using a moisture meter to monitor soil');
    } else if (issue.name === 'Leaf Spots') {
      recommendations.push('Check for fungal infection');
      recommendations.push('Remove affected leaves');
    } else if (issue.name === 'Stunted Growth') {
      recommendations.push('Verify nutrient levels');
      recommendations.push('Consider repotting with fresh soil');
    } else if (issue.name === 'Pest Detected') {
      recommendations.push('Inspect plant thoroughly for pests');
      recommendations.push('Apply neem oil or insecticidal soap');
    }
  });
  
  // If no issues, add general recommendations
  if (recommendations.length === 0) {
    recommendations.push('Maintain current care routine');
    recommendations.push('Continue regular monitoring');
  }
  
  return {
    plantId: plantId,
    currentHealthScore: latestReading.health_score,
    healthStatus: latestReading.health_score > 0.85 ? 'Excellent' : 
                 latestReading.health_score > 0.7 ? 'Good' : 
                 latestReading.health_score > 0.5 ? 'Fair' : 'Poor',
    issues,
    recommendations,
    healthReadings
  };
}

// Generate mock plant distribution data
function generateMockPlantDistribution(groupBy = 'type') {
  let distributionData = [];
  
  if (groupBy === 'type') {
    distributionData = [
      { name: 'Succulents', count: Math.floor(Math.random() * 5) + 1 },
      { name: 'Tropical', count: Math.floor(Math.random() * 5) + 3 },
      { name: 'Flowering', count: Math.floor(Math.random() * 4) + 2 },
      { name: 'Foliage', count: Math.floor(Math.random() * 5) + 3 },
      { name: 'Herbs', count: Math.floor(Math.random() * 3) + 1 }
    ];
  } else if (groupBy === 'location') {
    distributionData = [
      { name: 'Living Room', count: Math.floor(Math.random() * 5) + 3 },
      { name: 'Bedroom', count: Math.floor(Math.random() * 4) + 2 },
      { name: 'Kitchen', count: Math.floor(Math.random() * 3) + 1 },
      { name: 'Balcony', count: Math.floor(Math.random() * 5) + 2 },
      { name: 'Bathroom', count: Math.floor(Math.random() * 2) + 1 }
    ];
  } else if (groupBy === 'age') {
    distributionData = [
      { name: '< 1 month', count: Math.floor(Math.random() * 3) + 1 },
      { name: '1-3 months', count: Math.floor(Math.random() * 4) + 2 },
      { name: '3-6 months', count: Math.floor(Math.random() * 5) + 3 },
      { name: '6-12 months', count: Math.floor(Math.random() * 4) + 2 },
      { name: '> 1 year', count: Math.floor(Math.random() * 3) + 5 }
    ];
  } else if (groupBy === 'health') {
    distributionData = [
      { name: 'Excellent', count: Math.floor(Math.random() * 5) + 5 },
      { name: 'Good', count: Math.floor(Math.random() * 5) + 3 },
      { name: 'Fair', count: Math.floor(Math.random() * 3) + 2 },
      { name: 'Poor', count: Math.floor(Math.random() * 2) + 1 }
    ];
  }
  
  // Calculate totals
  const total = distributionData.reduce((sum, item) => sum + item.count, 0);
  
  // Add percentages
  distributionData = distributionData.map(item => ({
    ...item,
    percentage: parseFloat(((item.count / total) * 100).toFixed(1))
  }));
  
  return {
    groupBy,
    total,
    distribution: distributionData
  };
}

export default reportsApi;
