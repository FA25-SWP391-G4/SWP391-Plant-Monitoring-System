const { Pool } = require('pg');
const SystemLog = require('../models/SystemLog');
const Plant = require('../models/Plant');
const SensorData = require('../models/SensorData');
const WateringHistory = require('../models/WateringHistory');

// Mock database connection for development
const generateMockData = (timeRange, type) => {
  const now = new Date();
  let days = 7;
  
  switch (timeRange) {
    case 'day': days = 1; break;
    case 'week': days = 7; break;
    case 'month': days = 30; break;
    case 'quarter': days = 90; break;
    case 'year': days = 365; break;
  }
  
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const entry = {
      timestamp: date.toISOString(),
      date: date.toISOString().split('T')[0]
    };
    
    if (type === 'historical') {
      entry.moisture = Math.random() * 40 + 40;
      entry.temperature = Math.random() * 10 + 20;
      entry.humidity = Math.random() * 30 + 50;
      entry.light = Math.random() * 500 + 200;
    } else if (type === 'water') {
      entry.amount = Math.random() * 2 + 0.5;
      entry.sessions = Math.floor(Math.random() * 4) + 1;
    }
    
    data.push(entry);
  }
  
  return data;
};

const reportsController = {
  // Get comprehensive reports for dashboard
  getReports: async (req, res) => {
    try {
      const { timeRange = 'week' } = req.query;
      const userId = req.user.id;
      
      // In production, this would fetch real data from the database
      // For now, return mock data
      const reports = {
        moisture: generateMockData(timeRange, 'historical').map(item => ({
          date: item.date,
          value: item.moisture
        })),
        temperature: generateMockData(timeRange, 'historical').map(item => ({
          date: item.date,
          value: item.temperature
        })),
        humidity: generateMockData(timeRange, 'historical').map(item => ({
          date: item.date,
          value: item.humidity
        })),
        light: generateMockData(timeRange, 'historical').map(item => ({
          date: item.date,
          value: item.light
        })),
        waterConsumption: generateMockData(timeRange, 'water'),
        summary: {
          totalPlants: 5,
          healthyPlants: 4,
          criticalPlants: 1,
          avgMoisture: 65,
          totalWaterUsed: 15.5
        }
      };
      
      await SystemLog.info('reports', 'getReports', `Reports fetched for user ${userId} with time range ${timeRange}`);
      res.json(reports);
    } catch (error) {
      await SystemLog.error('reports', 'getReports', error.message);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  },

  // Get historical data for a specific plant
  getHistoricalData: async (req, res) => {
    try {
      const { plantId } = req.params;
      const { timeRange = 'week', metrics = '' } = req.query;
      const userId = req.user.id;
      
      const selectedMetrics = metrics ? metrics.split(',') : ['moisture', 'temperature'];
      
      // Mock data generation
      const data = generateMockData(timeRange, 'historical');
      
      const result = {
        plantId: parseInt(plantId),
        timeRange,
        metrics: selectedMetrics,
        data: data.map(item => {
          const entry = { timestamp: item.timestamp };
          selectedMetrics.forEach(metric => {
            entry[metric] = item[metric];
          });
          return entry;
        })
      };
      
      await SystemLog.info('reports', 'getHistoricalData', `Historical data fetched for plant ${plantId}`);
      res.json(result);
    } catch (error) {
      await SystemLog.error('reports', 'getHistoricalData', error.message);
      res.status(500).json({ error: 'Failed to fetch historical data' });
    }
  },

  // Get water consumption data
  getWaterConsumption: async (req, res) => {
    try {
      const { timeRange = 'month', plant = 'all' } = req.query;
      const userId = req.user.id;
      
      const dailyData = generateMockData(timeRange, 'water');
      
      const summary = {
        totalWater: dailyData.reduce((sum, day) => sum + day.amount, 0),
        totalSessions: dailyData.reduce((sum, day) => sum + day.sessions, 0),
        avgDaily: dailyData.reduce((sum, day) => sum + day.amount, 0) / dailyData.length,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: Math.random() * 15 + 5
      };
      
      const plantData = [
        { plantName: 'Snake Plant', totalWater: 8.5, sessions: 12, efficiency: 92 },
        { plantName: 'Peace Lily', totalWater: 12.3, sessions: 18, efficiency: 85 },
        { plantName: 'Rubber Plant', totalWater: 15.7, sessions: 22, efficiency: 78 }
      ];
      
      const hourlyPattern = Array.from({length: 24}, (_, i) => ({
        hour: i,
        sessions: Math.floor(Math.random() * 3),
        amount: Math.random() * 0.8
      }));
      
      const result = {
        summary,
        dailyData,
        plantData,
        hourlyPattern
      };
      
      await SystemLog.info('reports', 'getWaterConsumption', `Water consumption data fetched for user ${userId}`);
      res.json(result);
    } catch (error) {
      await SystemLog.error('reports', 'getWaterConsumption', error.message);
      res.status(500).json({ error: 'Failed to fetch water consumption data' });
    }
  },

  // Get plant health data
  getPlantHealth: async (req, res) => {
    try {
      const { timeRange = 'month' } = req.query;
      const userId = req.user.id;
      
      const healthHistory = generateMockData(timeRange, 'historical').map(item => ({
        date: item.date,
        avgHealth: Math.random() * 20 + 70,
        healthyPlants: Math.floor(Math.random() * 4) + 2,
        criticalPlants: Math.floor(Math.random() * 2)
      }));
      
      const plantHealth = [
        {
          id: 1,
          name: 'Snake Plant',
          type: 'Sansevieria',
          healthScore: 85,
          lastCheck: new Date(Date.now() - 2 * 60 * 60 * 1000),
          issues: [],
          recommendations: ['Continue current care routine'],
          metrics: { moisture: 45, temperature: 22, humidity: 60, light: 300 }
        },
        {
          id: 2,
          name: 'Peace Lily',
          type: 'Spathiphyllum',
          healthScore: 72,
          lastCheck: new Date(Date.now() - 4 * 60 * 60 * 1000),
          issues: ['Low humidity'],
          recommendations: ['Increase humidity', 'Move closer to water source'],
          metrics: { moisture: 65, temperature: 24, humidity: 45, light: 250 }
        }
      ];
      
      const overview = {
        totalPlants: plantHealth.length,
        healthyPlants: plantHealth.filter(p => p.healthScore >= 80).length,
        warningPlants: plantHealth.filter(p => p.healthScore >= 60 && p.healthScore < 80).length,
        criticalPlants: plantHealth.filter(p => p.healthScore < 60).length,
        avgHealthScore: plantHealth.reduce((sum, p) => sum + p.healthScore, 0) / plantHealth.length
      };
      
      const healthFactors = [
        { factor: 'Moisture Levels', impact: 85, description: 'Optimal soil moisture maintained' },
        { factor: 'Temperature', impact: 78, description: 'Temperature within ideal range' },
        { factor: 'Light Exposure', impact: 92, description: 'Adequate light exposure' },
        { factor: 'Humidity', impact: 73, description: 'Humidity could be improved' }
      ];
      
      const alerts = [
        { severity: 'medium', plant: 'Peace Lily', issue: 'Low humidity detected', time: '2 hours ago' }
      ];
      
      const result = {
        overview,
        healthHistory,
        plantHealth,
        healthFactors,
        alerts
      };
      
      await SystemLog.info('reports', 'getPlantHealth', `Plant health data fetched for user ${userId}`);
      res.json(result);
    } catch (error) {
      await SystemLog.error('reports', 'getPlantHealth', error.message);
      res.status(500).json({ error: 'Failed to fetch plant health data' });
    }
  },

  // Get custom reports for user
  getCustomReports: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Mock custom reports
      const customReports = [
        {
          id: 1,
          name: 'Weekly Plant Moisture Summary',
          description: 'Weekly moisture levels across all plants',
          plants: ['all'],
          metrics: ['moisture'],
          chartType: 'line',
          timeRange: 'week',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
      
      await SystemLog.info('reports', 'getCustomReports', `Custom reports fetched for user ${userId}`);
      res.json({ data: customReports });
    } catch (error) {
      await SystemLog.error('reports', 'getCustomReports', error.message);
      res.status(500).json({ error: 'Failed to fetch custom reports' });
    }
  },

  // Create custom report
  createCustomReport: async (req, res) => {
    try {
      const userId = req.user.id;
      const reportData = req.body;
      
      // Mock creation - in production, save to database
      const newReport = {
        id: Date.now(),
        ...reportData,
        createdAt: new Date(),
        lastRun: null
      };
      
      await SystemLog.info('reports', 'createCustomReport', `Custom report created for user ${userId}: ${reportData.name}`);
      res.json({ data: newReport });
    } catch (error) {
      await SystemLog.error('reports', 'createCustomReport', error.message);
      res.status(500).json({ error: 'Failed to create custom report' });
    }
  },

  // Run custom report
  runCustomReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;
      
      // Mock report execution
      const reportData = {
        id: parseInt(reportId),
        name: 'Weekly Plant Moisture Summary',
        description: 'Weekly moisture levels across all plants',
        metrics: ['moisture'],
        chartType: 'line',
        data: generateMockData('week', 'historical'),
        generatedAt: new Date()
      };
      
      await SystemLog.info('reports', 'runCustomReport', `Custom report ${reportId} executed for user ${userId}`);
      res.json({ data: reportData });
    } catch (error) {
      await SystemLog.error('reports', 'runCustomReport', error.message);
      res.status(500).json({ error: 'Failed to run custom report' });
    }
  },

  // Delete custom report
  deleteCustomReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;
      
      // Mock deletion - in production, delete from database
      
      await SystemLog.info('reports', 'deleteCustomReport', `Custom report ${reportId} deleted for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      await SystemLog.error('reports', 'deleteCustomReport', error.message);
      res.status(500).json({ error: 'Failed to delete custom report' });
    }
  }
};

module.exports = reportsController;