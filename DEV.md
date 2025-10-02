# 🌱 Plant Monitoring System - Development Guide

## 📋 **31 Use Cases Implementation Guide**

This document provides a comprehensive guide for implementing all 31 use cases for the Plant Monitoring IoT System, organized by user roles and technical requirements.

---

## 🎯 **Use Case Categories**

- **👤 Regular User**: 12 Use Cases
- **💎 Premium User**: 11 Use Cases  
- **🔧 Admin**: 8 Use Cases
- **🤖 IoT System**: 3 Use Cases

---

## 1. 👤 **Regular User Use Cases (12)**

### **1.1 User Registration**
**Status**: ❌ Not Implemented (Removed as requested)
- **Description**: Create account with email, password, basic info
- **Preconditions**: No existing account
- **Postconditions**: Account created, verification email sent
- **Tech Stack**: JWT, SMTP
- **Implementation Notes**: User registration was removed per client request. Only password reset remains.

```javascript
// Implementation Location: controllers/authController.js (removed)
// Models: User.js (save method exists but not exposed)
// Routes: routes/auth.js (registration routes removed)
```

### **1.2 User Login**
**Status**: ❌ Not Implemented (Removed as requested)
- **Description**: Login with email/password
- **Preconditions**: Valid account
- **Postconditions**: Session created, access to dashboard
- **Tech Stack**: Session management, JWT
- **Implementation Notes**: Login was removed per client request. Only password reset functionality remains.

```javascript
// Implementation Location: controllers/authController.js (removed)
// Models: User.js (validatePassword method exists)
// Routes: routes/auth.js (login routes removed)
```

### **1.3 User Logout**
**Status**: ❌ Not Implemented (Removed as requested)
- **Description**: End session
- **Preconditions**: Logged in
- **Postconditions**: Session destroyed, redirect to homepage
- **Tech Stack**: Clear JWT
- **Implementation Notes**: Logout was removed per client request.

```javascript
// Implementation Location: Frontend (clear JWT token)
// No backend needed for stateless JWT
```

### **1.4 View Plant Monitoring Dashboard**
**Status**: 🟡 Partially Implemented
- **Description**: View real-time sensor data (moisture, temperature, light)
- **Preconditions**: Logged in, IoT device online
- **Postconditions**: Data updates every 5-10 seconds
- **Tech Stack**: WebSocket, Chart.js

```javascript
// Implementation Needed:
// 1. Frontend dashboard component
// 2. WebSocket connection for real-time updates
// 3. Chart.js integration

// Models Available:
const { SensorData, Device, Plant } = require('./models');

// API Endpoints to Create:
// GET /api/dashboard/sensor-data/:deviceId
// WebSocket: /socket.io for real-time updates

// Example Implementation:
app.get('/api/dashboard/sensor-data/:deviceId', async (req, res) => {
    const latestData = await SensorData.getLatestByDeviceId(req.params.deviceId);
    const averages = await SensorData.getAveragesByDeviceId(req.params.deviceId, 24);
    res.json({ latest: latestData, averages });
});
```

### **1.5 Manual Watering**
**Status**: 🟡 Partially Implemented
- **Description**: Activate pump, select duration
- **Preconditions**: Logged in, IoT device online
- **Postconditions**: Pump runs, log recorded
- **Tech Stack**: MQTT/HTTP

```javascript
// Implementation Needed:
// 1. MQTT client for device communication
// 2. Pump control endpoint
// 3. Duration validation

// Models Available:
const { WateringHistory, Plant, Device } = require('./models');

// API Endpoint to Create:
// POST /api/watering/manual
app.post('/api/watering/manual', async (req, res) => {
    const { plantId, duration } = req.body;
    
    // Validate plant ownership and device status
    const plant = await Plant.findById(plantId);
    const device = await Device.findById(plant.device_id);
    
    if (!device.isOnline()) {
        return res.status(400).json({ error: 'Device is offline' });
    }
    
    // Send MQTT command to device
    // mqttClient.publish(`devices/${device.device_key}/pump`, JSON.stringify({
    //     action: 'start',
    //     duration: duration
    // }));
    
    // Log watering event
    await WateringHistory.logWatering(plantId, 'manual', duration);
    
    res.json({ success: true, message: 'Watering started' });
});
```

### **1.6 Configure Auto-Watering Schedule**
**Status**: ✅ Models Ready
- **Description**: Set schedule based on sensor thresholds
- **Preconditions**: Logged in
- **Postconditions**: Schedule saved, auto-activation enabled
- **Tech Stack**: Server-side scheduler (node-cron)

```javascript
// Implementation Needed:
// 1. Schedule management UI
// 2. Cron job scheduler
// 3. Threshold configuration

// Models Available:
const { PumpSchedule, Plant } = require('./models');

// API Endpoints to Create:
// POST /api/schedule/create
// PUT /api/schedule/:id/update
// DELETE /api/schedule/:id

// Example Implementation:
const cron = require('node-cron');

app.post('/api/schedule/create', async (req, res) => {
    const { plantId, cronExpression } = req.body;
    
    const schedule = new PumpSchedule({
        plant_id: plantId,
        cron_expression: cronExpression,
        is_active: true
    });
    
    await schedule.save();
    
    // Register cron job
    cron.schedule(cronExpression, async () => {
        const plant = await Plant.findById(plantId);
        if (plant.auto_watering_on && await plant.needsWatering()) {
            // Trigger watering
            await WateringHistory.logWatering(plantId, 'schedule');
        }
    });
    
    res.json({ success: true, schedule });
});
```

### **1.7 Toggle Auto-Watering Mode**
**Status**: ✅ Models Ready
- **Description**: Enable/disable automatic mode
- **Preconditions**: Logged in, schedule configured
- **Postconditions**: Mode updated
- **Tech Stack**: DB flag update

```javascript
// Models Available:
const { Plant } = require('./models');

// API Endpoint to Create:
// PUT /api/plant/:id/auto-watering
app.put('/api/plant/:id/auto-watering', async (req, res) => {
    const plant = await Plant.findById(req.params.id);
    await plant.toggleAutoWatering();
    res.json({ success: true, auto_watering_on: plant.auto_watering_on });
});
```

### **1.8 View Watering History**
**Status**: ✅ Models Ready
- **Description**: View watering logs (time, amount, type)
- **Preconditions**: Logged in
- **Postconditions**: Log table with date filters
- **Tech Stack**: SQL query, CSV export

```javascript
// Models Available:
const { WateringHistory } = require('./models');

// API Endpoints to Create:
// GET /api/watering/history/:plantId
// GET /api/watering/history/:plantId/export

app.get('/api/watering/history/:plantId', async (req, res) => {
    const { startDate, endDate, limit = 50 } = req.query;
    
    let history;
    if (startDate && endDate) {
        history = await WateringHistory.findByDateRange(req.params.plantId, startDate, endDate);
    } else {
        history = await WateringHistory.findByPlantId(req.params.plantId, limit);
    }
    
    res.json({ history });
});
```

### **1.9 Search Watering History**
**Status**: ✅ Models Ready
- **Description**: Search logs by date/type
- **Preconditions**: Logged in
- **Postconditions**: Results displayed
- **Tech Stack**: SQL LIKE, Elasticsearch

```javascript
// Models Available:
const { WateringHistory } = require('./models');

// API Endpoint to Create:
// GET /api/watering/search
app.get('/api/watering/search', async (req, res) => {
    const { plantId, triggerType, startDate, endDate } = req.query;
    
    let results;
    if (triggerType) {
        results = await WateringHistory.findByTriggerType(triggerType);
    } else if (startDate && endDate) {
        results = await WateringHistory.findByDateRange(plantId, startDate, endDate);
    }
    
    res.json({ results });
});
```

### **1.10 Receive Real-Time Notifications**
**Status**: ✅ Models Ready
- **Description**: Get alerts for low moisture or device errors
- **Preconditions**: Logged in, IoT device online
- **Postconditions**: Alerts displayed
- **Tech Stack**: Firebase push, SMTP

```javascript
// Models Available:
const { Alert } = require('./models');

// Implementation Needed:
// 1. WebSocket for real-time notifications
// 2. Firebase Cloud Messaging setup
// 3. Email notification service

// API Endpoints to Create:
// GET /api/alerts/unread
// PUT /api/alerts/:id/read
// WebSocket: /socket.io for real-time alerts

app.get('/api/alerts/unread', async (req, res) => {
    const alerts = await Alert.findUnreadByUserId(req.user.id);
    res.json({ alerts });
});

// Real-time notification trigger
async function checkAndSendAlerts(plantId) {
    const plant = await Plant.findById(plantId);
    if (await plant.needsWatering()) {
        await Alert.createPlantAlert(
            plant.user_id,
            plant.custom_name,
            'low_moisture',
            `Soil moisture below ${plant.moisture_threshold}%`
        );
        
        // Send via WebSocket
        io.to(`user_${plant.user_id}`).emit('alert', {
            type: 'low_moisture',
            plant: plant.custom_name
        });
    }
}
```

### **1.11 Reset Password**
**Status**: ✅ Implemented
- **Description**: Request password reset via email
- **Preconditions**: Registered email
- **Postconditions**: Reset email sent, valid verification link
- **Tech Stack**: SMTP, JWT (temporary token)

```javascript
// ✅ Already Implemented:
// controllers/authController.js - forgotPassword, resetPassword
// models/User.js - password reset functionality
// routes/auth.js - password reset endpoints
// tests/ - comprehensive test coverage
```

### **1.12 Change Password**
**Status**: 🟡 Partially Implemented
- **Description**: Change account password
- **Preconditions**: Logged in, correct old password
- **Postconditions**: New password updated
- **Tech Stack**: SQL update, bcrypt

```javascript
// Models Available:
const { User } = require('./models');

// API Endpoint to Create:
// PUT /api/user/change-password
app.put('/api/user/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!await user.validatePassword(currentPassword)) {
        return res.status(400).json({ error: 'Current password incorrect' });
    }
    
    await user.updatePassword(newPassword);
    res.json({ success: true, message: 'Password updated' });
});
```

### **1.13 Manage Profile**
**Status**: ✅ Models Ready
- **Description**: View and edit profile info
- **Preconditions**: Logged in
- **Postconditions**: Profile updated
- **Tech Stack**: SQL CRUD, React.js

```javascript
// Models Available:
const { User } = require('./models');

// API Endpoints to Create:
// GET /api/user/profile
// PUT /api/user/profile

app.get('/api/user/profile', async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ user: user.toJSON() });
});

app.put('/api/user/profile', async (req, res) => {
    const user = await User.findById(req.user.id);
    Object.assign(user, req.body);
    await user.save();
    res.json({ success: true, user: user.toJSON() });
});
```

---

## 2. 💎 **Premium User Use Cases (11)**

### **2.1 Manage Multiple Plant Zones**
**Status**: ✅ Models Ready
- **Description**: Add/remove garden zones, assign sensors/pumps
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Zone list updated
- **Tech Stack**: Multi-tenant, UI tabs

```javascript
// Models Available:
const { Plant, Device } = require('./models');

// Implementation Needed:
// 1. Zone management system
// 2. Device assignment logic
// 3. Premium user validation middleware

// API Endpoints to Create:
// GET /api/zones
// POST /api/zones/create
// PUT /api/zones/:id/assign-device
// DELETE /api/zones/:id

// Premium middleware
const requirePremium = (req, res, next) => {
    if (req.user.role !== 'Premium' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Premium subscription required' });
    }
    next();
};

app.get('/api/zones', requirePremium, async (req, res) => {
    const plants = await Plant.findByUserId(req.user.id);
    const zones = groupPlantsByZone(plants);
    res.json({ zones });
});
```

### **2.2 View Detailed Plant Health Report**
**Status**: ✅ Models Ready
- **Description**: Generate detailed reports (moisture trends, light)
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Report exported as PDF/Excel
- **Tech Stack**: Aggregation query, export library

```javascript
// Models Available:
const { SensorData, Plant } = require('./models');

// Implementation Needed:
// 1. Report generation logic
// 2. PDF/Excel export libraries (puppeteer, exceljs)
// 3. Data aggregation and analysis

// API Endpoints to Create:
// GET /api/reports/plant-health/:plantId
// GET /api/reports/plant-health/:plantId/export

const PDFDocument = require('pdfkit');

app.get('/api/reports/plant-health/:plantId/export', requirePremium, async (req, res) => {
    const { format = 'pdf', days = 30 } = req.query;
    const plant = await Plant.findById(req.params.plantId);
    const sensorData = await SensorData.findByDeviceId(plant.device_id, 1000);
    
    if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="plant-health-${plant.custom_name}.pdf"`);
        
        doc.pipe(res);
        doc.text(`Plant Health Report: ${plant.custom_name}`);
        // Add charts and data
        doc.end();
    }
});
```

### **2.3 Configure Advanced Sensor Thresholds**
**Status**: ✅ Models Ready
- **Description**: Complex thresholds (moisture + temperature combinations)
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Thresholds saved
- **Tech Stack**: Rules engine

```javascript
// Models Available:
const { Plant } = require('./models');

// Implementation Needed:
// 1. Advanced threshold configuration UI
// 2. Rules engine for complex conditions
// 3. Threshold validation logic

// Example: Advanced threshold structure
const advancedThreshold = {
    rules: [
        {
            condition: 'AND',
            criteria: [
                { sensor: 'soil_moisture', operator: '<', value: 30 },
                { sensor: 'temperature', operator: '>', value: 25 }
            ],
            action: 'water',
            duration: 120
        }
    ]
};

app.put('/api/plant/:id/advanced-thresholds', requirePremium, async (req, res) => {
    const { thresholds } = req.body;
    const plant = await Plant.findById(req.params.id);
    
    // Store in notification_prefs or new field
    plant.advanced_thresholds = JSON.stringify(thresholds);
    await plant.save();
    
    res.json({ success: true });
});
```

### **2.4 Search Plant Health Reports**
**Status**: ✅ Models Ready
- **Description**: Search reports by time/zone
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Results displayed
- **Tech Stack**: SQL query, Elasticsearch

```javascript
// Models Available:
const { SensorData, Plant } = require('./models');

// API Endpoint to Create:
// GET /api/reports/search
app.get('/api/reports/search', requirePremium, async (req, res) => {
    const { query, startDate, endDate, plantId } = req.query;
    
    let results;
    if (plantId && startDate && endDate) {
        results = await SensorData.findByDateRange(plantId, startDate, endDate);
    } else {
        results = await SensorData.findByUserId(req.user.id, 100);
    }
    
    res.json({ results });
});
```

### **2.5 Customize Dashboard**
**Status**: 🟡 Frontend Needed
- **Description**: Choose widgets (charts, watering schedule)
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Personalized dashboard saved
- **Tech Stack**: Drag-and-drop UI, React

```javascript
// Implementation Needed:
// 1. Frontend dashboard customization (React DnD)
// 2. Widget configuration storage
// 3. Dashboard layout persistence

// API Endpoints to Create:
// GET /api/dashboard/layout
// PUT /api/dashboard/layout

app.put('/api/dashboard/layout', requirePremium, async (req, res) => {
    const { layout } = req.body;
    const user = await User.findById(req.user.id);
    
    user.notification_prefs = {
        ...user.notification_prefs,
        dashboard_layout: layout
    };
    
    await user.save();
    res.json({ success: true });
});
```

### **2.6 Upgrade to Premium**
**Status**: ✅ Models Ready
- **Description**: Upgrade from Regular to Premium
- **Preconditions**: Logged in, Regular account
- **Postconditions**: Premium privileges unlocked
- **Tech Stack**: VNPay, DB update

```javascript
// Models Available:
const { User, Payment } = require('./models');

// API Endpoints to Create:
// POST /api/payment/upgrade-premium
// GET /api/payment/verify-upgrade

app.post('/api/payment/upgrade-premium', async (req, res) => {
    const { amount = 299000 } = req.body; // 299k VND
    const user = await User.findById(req.user.id);
    
    if (user.role === 'Premium') {
        return res.status(400).json({ error: 'Already Premium user' });
    }
    
    const payment = await Payment.createPayment(
        user.user_id,
        amount,
        Payment.generateVNPayTxnRef()
    );
    
    // Generate VNPay payment URL
    const vnpayUrl = generateVNPayURL(payment);
    
    res.json({ payment_url: vnpayUrl, payment_id: payment.payment_id });
});

app.get('/api/payment/verify-upgrade', async (req, res) => {
    const { vnp_TxnRef, vnp_ResponseCode } = req.query;
    const payment = await Payment.findByVNPayTxnRef(vnp_TxnRef);
    
    if (vnp_ResponseCode === '00') {
        await payment.markAsCompleted();
        const user = await User.findById(payment.user_id);
        user.role = 'Premium';
        await user.save();
        
        res.json({ success: true, message: 'Premium upgrade successful' });
    } else {
        await payment.markAsFailed();
        res.status(400).json({ error: 'Payment failed' });
    }
});
```

### **2.7 Predict Watering Needs (AI)**
**Status**: 🔴 AI Model Needed
- **Description**: AI predicts watering time/amount based on sensors and weather
- **Preconditions**: Logged in, Premium, sufficient sensor data
- **Postconditions**: Watering suggestions displayed
- **Tech Stack**: ML model, OpenWeatherMap API

```javascript
// Models Available:
const { AIModel, SensorData, Plant } = require('./models');

// Implementation Needed:
// 1. ML model training (Python/TensorFlow)
// 2. Weather API integration
// 3. Prediction API endpoint

// API Endpoint to Create:
// GET /api/ai/predict-watering/:plantId

app.get('/api/ai/predict-watering/:plantId', requirePremium, async (req, res) => {
    const plant = await Plant.findById(req.params.plantId);
    const recentData = await SensorData.findByDeviceId(plant.device_id, 100);
    
    if (recentData.length < 50) {
        return res.status(400).json({ error: 'Insufficient data for prediction' });
    }
    
    // Call AI prediction service
    const prediction = await callAIPredictionService({
        plant_data: plant.toJSON(),
        sensor_history: recentData,
        weather_data: await getWeatherData()
    });
    
    res.json({ prediction });
});

// Python ML Service (separate microservice)
async function callAIPredictionService(data) {
    const response = await fetch('http://ai-service:5000/predict-watering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}
```

### **2.8 Analyze Plant Health (AI)**
**Status**: 🔴 AI Model Needed
- **Description**: AI analyzes sensor history for health warnings
- **Preconditions**: Logged in, Premium, sufficient historical data
- **Postconditions**: Health report displayed, alerts sent if needed
- **Tech Stack**: ML model (classification), Python Flask API

```javascript
// API Endpoint to Create:
// GET /api/ai/analyze-health/:plantId

app.get('/api/ai/analyze-health/:plantId', requirePremium, async (req, res) => {
    const plant = await Plant.findById(req.params.plantId);
    const historicalData = await SensorData.findByDeviceId(plant.device_id, 1000);
    
    if (historicalData.length < 100) {
        return res.status(400).json({ error: 'Insufficient historical data' });
    }
    
    const analysis = await callAIHealthAnalysis({
        plant_data: plant.toJSON(),
        sensor_history: historicalData
    });
    
    // Create alerts for health issues
    if (analysis.health_score < 0.7) {
        await Alert.createPlantAlert(
            plant.user_id,
            plant.custom_name,
            'health_warning',
            analysis.recommendations.join(', ')
        );
    }
    
    res.json({ analysis });
});
```

### **2.9 Make Payment for Premium**
**Status**: ✅ Models Ready
- **Description**: Pay for Premium upgrade/renewal via VNPay
- **Preconditions**: Logged in, Regular or expired Premium
- **Postconditions**: Transaction completed, Premium activated/renewed
- **Tech Stack**: VNPay API, DB update

```javascript
// ✅ Already covered in 2.6 Upgrade to Premium
// Models Available: Payment.js with VNPay integration
```

### **2.10 Interact with AI Chatbot**
**Status**: ✅ Models Ready
- **Description**: Chat with AI for plant care advice
- **Preconditions**: Logged in, Premium account
- **Postconditions**: Chatbot responds, conversation history saved
- **Tech Stack**: Dialogflow/Rasa, React.js

```javascript
// Models Available:
const { ChatHistory } = require('./models');

// Implementation Needed:
// 1. AI chatbot integration (Dialogflow/OpenAI)
// 2. WebSocket for real-time chat
// 3. Context-aware responses

// API Endpoints to Create:
// POST /api/chat/message
// GET /api/chat/history

app.post('/api/chat/message', requirePremium, async (req, res) => {
    const { message } = req.body;
    
    // Save user message
    const chat = await ChatHistory.createChat(req.user.id, message);
    
    // Get AI response
    const aiResponse = await getAIResponse(message, req.user.id);
    
    // Update with AI response
    await chat.updateAIResponse(aiResponse);
    
    res.json({ response: aiResponse, chat_id: chat.chat_id });
});

async function getAIResponse(message, userId) {
    // Integration with AI service (OpenAI, Dialogflow, etc.)
    const context = await ChatHistory.findRecentByUserId(userId, 5);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a plant care expert AI assistant.' },
                ...context.map(c => ({ role: 'user', content: c.user_message })),
                { role: 'user', content: message }
            ]
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

---

## 3. 🔧 **Admin Use Cases (8)**

### **3.1 Manage Users**
**Status**: ✅ Models Ready
- **Description**: Add/delete/edit accounts, assign Regular/Premium roles
- **Preconditions**: Admin logged in
- **Postconditions**: User list updated
- **Tech Stack**: RBAC, SQL CRUD

```javascript
// Models Available:
const { User } = require('./models');

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// API Endpoints to Create:
// GET /api/admin/users
// PUT /api/admin/users/:id/role
// DELETE /api/admin/users/:id

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const { page = 1, limit = 50, role } = req.query;
    
    let query = 'SELECT * FROM Users';
    const params = [];
    
    if (role) {
        query += ' WHERE role = $1';
        params.push(role);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
});

app.put('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    user.role = role;
    await user.save();
    res.json({ success: true, user: user.toJSON() });
});
```

### **3.2 View System-Wide Reports**
**Status**: ✅ Models Ready
- **Description**: View aggregated watering data, errors, user activity
- **Preconditions**: Admin logged in
- **Postconditions**: Reports exported as PDF/CSV
- **Tech Stack**: Aggregation query, Chart.js

```javascript
// Models Available:
const { WateringHistory, SystemLog, User, SensorData } = require('./models');

// API Endpoints to Create:
// GET /api/admin/reports/overview
// GET /api/admin/reports/watering-stats
// GET /api/admin/reports/system-health

app.get('/api/admin/reports/overview', requireAdmin, async (req, res) => {
    const { days = 30 } = req.query;
    
    const [userStats, wateringStats, systemStats] = await Promise.all([
        getUserStats(days),
        getWateringStats(days),
        getSystemHealthStats(days)
    ]);
    
    res.json({ userStats, wateringStats, systemStats });
});

async function getUserStats(days) {
    const query = `
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'Premium' THEN 1 END) as premium_users,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as new_users
        FROM Users
    `;
    const result = await pool.query(query);
    return result.rows[0];
}
```

### **3.3 Configure Global Settings**
**Status**: 🟡 Configuration System Needed
- **Description**: Set default thresholds, IoT API keys, AI configuration
- **Preconditions**: Admin logged in
- **Postconditions**: Global configuration applied
- **Tech Stack**: Config file/DB

```javascript
// Implementation Needed:
// 1. Global settings table/file
// 2. Settings management UI
// 3. Configuration validation

// API Endpoints to Create:
// GET /api/admin/settings
// PUT /api/admin/settings

const globalSettings = {
    default_moisture_threshold: 30,
    sensor_reading_interval: 300, // 5 minutes
    ai_prediction_enabled: true,
    max_devices_per_user: 10,
    premium_price: 299000
};

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    // Load from database or config file
    res.json({ settings: globalSettings });
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    const { settings } = req.body;
    
    // Validate and save settings
    Object.assign(globalSettings, settings);
    
    // Save to database/file
    await saveGlobalSettings(globalSettings);
    
    res.json({ success: true, settings: globalSettings });
});
```

### **3.4 Monitor System Logs**
**Status**: ✅ Models Ready
- **Description**: View error logs, IoT activity, user actions
- **Preconditions**: Admin logged in
- **Postconditions**: Logs displayed with filters
- **Tech Stack**: Log4j, ELK stack

```javascript
// Models Available:
const { SystemLog } = require('./models');

// API Endpoints to Create:
// GET /api/admin/logs
// GET /api/admin/logs/search

app.get('/api/admin/logs', requireAdmin, async (req, res) => {
    const { level, source, limit = 100, page = 1 } = req.query;
    
    let logs;
    if (level) {
        logs = await SystemLog.findByLevel(level, limit);
    } else if (source) {
        logs = await SystemLog.findBySource(source, limit);
    } else {
        logs = await SystemLog.findAll(limit);
    }
    
    res.json({ logs });
});

app.get('/api/admin/logs/search', requireAdmin, async (req, res) => {
    const { query, limit = 100 } = req.query;
    const logs = await SystemLog.searchByMessage(query, limit);
    res.json({ logs });
});

// Auto-logging middleware
app.use((req, res, next) => {
    SystemLog.info('API', `${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'}`);
    next();
});
```

### **3.5 Backup and Restore Data**
**Status**: 🟡 Implementation Needed
- **Description**: Backup/restore database
- **Preconditions**: Admin logged in
- **Postconditions**: Data secured
- **Tech Stack**: Cron job, encryption

```javascript
// Implementation Needed:
// 1. Database backup scripts
// 2. Encryption for backup files
// 3. Restore functionality

const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

// API Endpoints to Create:
// POST /api/admin/backup
// POST /api/admin/restore

app.post('/api/admin/backup', requireAdmin, async (req, res) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backupFile = `backup_${timestamp}.sql`;
    
    const command = `pg_dump ${process.env.POSTGRES_DB} > ${backupFile}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            SystemLog.error('Backup', `Backup failed: ${error.message}`);
            return res.status(500).json({ error: 'Backup failed' });
        }
        
        // Encrypt backup file
        const encrypted = encryptBackup(backupFile);
        
        SystemLog.info('Backup', `Backup created: ${backupFile}`);
        res.json({ success: true, backup_file: backupFile });
    });
});
```

### **3.6 Manage AI Models**
**Status**: ✅ Models Ready
- **Description**: Upload, update, check AI model performance
- **Preconditions**: Admin logged in, AI model exists
- **Postconditions**: Model updated, performance logged
- **Tech Stack**: MLflow, Flask API

```javascript
// Models Available:
const { AIModel } = require('./models');

// API Endpoints to Create:
// GET /api/admin/ai-models
// POST /api/admin/ai-models/upload
// PUT /api/admin/ai-models/:id/activate

app.get('/api/admin/ai-models', requireAdmin, async (req, res) => {
    const models = await AIModel.findAll();
    res.json({ models });
});

app.post('/api/admin/ai-models/upload', requireAdmin, async (req, res) => {
    const { model_name, version, file_path } = req.body;
    
    const aiModel = new AIModel({
        model_name,
        version,
        file_path,
        uploaded_by: req.user.id,
        is_active: false
    });
    
    await aiModel.save();
    SystemLog.info('AI', `New model uploaded: ${model_name} v${version}`);
    
    res.json({ success: true, model: aiModel });
});

app.put('/api/admin/ai-models/:id/activate', requireAdmin, async (req, res) => {
    const model = await AIModel.findById(req.params.id);
    await model.setAsActive();
    
    SystemLog.info('AI', `Model activated: ${model.model_name}`);
    res.json({ success: true });
});
```

### **3.7 Optimize Watering Schedules (AI)**
**Status**: 🔴 AI Model Needed
- **Description**: AI suggests optimal global watering schedules
- **Preconditions**: Admin logged in, sufficient data
- **Postconditions**: Optimal schedules applied or suggested
- **Tech Stack**: ML model (optimization), Weather API

```javascript
// API Endpoint to Create:
// POST /api/admin/ai/optimize-schedules

app.post('/api/admin/ai/optimize-schedules', requireAdmin, async (req, res) => {
    const allPlants = await Plant.findAll();
    const weatherData = await getWeatherForecast();
    
    const optimizations = await callAIOptimizationService({
        plants: allPlants,
        weather: weatherData,
        historical_data: await getHistoricalOptimizationData()
    });
    
    // Apply or suggest optimizations
    for (const opt of optimizations) {
        if (opt.confidence > 0.8) {
            // Auto-apply high confidence optimizations
            await PumpSchedule.createDailySchedule(opt.plant_id, opt.optimal_hour);
        }
    }
    
    SystemLog.info('AI', `Schedule optimization completed: ${optimizations.length} suggestions`);
    res.json({ optimizations });
});
```

### **3.8 Manage Multi-Language Settings**
**Status**: 🟡 Implementation Needed
- **Description**: Configure Vietnamese and English language support
- **Preconditions**: Admin logged in
- **Postconditions**: Languages applied system-wide
- **Tech Stack**: i18next, DB settings

```javascript
// Implementation Needed:
// 1. i18next setup
// 2. Language resource files
// 3. Language switching API

const i18next = require('i18next');

// API Endpoints to Create:
// GET /api/admin/languages
// PUT /api/admin/languages/default

const supportedLanguages = {
    'vi': 'Tiếng Việt',
    'en': 'English'
};

app.get('/api/admin/languages', requireAdmin, async (req, res) => {
    res.json({ 
        supported: supportedLanguages,
        default: process.env.DEFAULT_LANGUAGE || 'vi'
    });
});

app.put('/api/admin/languages/default', requireAdmin, async (req, res) => {
    const { language } = req.body;
    
    if (!supportedLanguages[language]) {
        return res.status(400).json({ error: 'Unsupported language' });
    }
    
    // Update environment or database setting
    process.env.DEFAULT_LANGUAGE = language;
    
    SystemLog.info('Admin', `Default language changed to: ${language}`);
    res.json({ success: true });
});
```

---

## 4. 🤖 **IoT System Use Cases (3)**

### **4.1 Collect and Send Sensor Data**
**Status**: ✅ Models Ready
- **Description**: Collect and send sensor data every 5 minutes
- **Preconditions**: Internet connection
- **Postconditions**: Data saved to database, ready for AI
- **Tech Stack**: ESP32, MQTT

```javascript
// Models Available:
const { SensorData, Device } = require('./models');

// Implementation Needed:
// 1. MQTT broker setup (Mosquitto)
// 2. Device authentication
// 3. Data validation and storage

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// MQTT Topics:
// devices/{device_key}/sensor-data
// devices/{device_key}/status

client.on('message', async (topic, message) => {
    try {
        const [, deviceKey, messageType] = topic.split('/');
        const device = await Device.findByDeviceKey(deviceKey);
        
        if (!device) {
            SystemLog.warning('IoT', `Unknown device: ${deviceKey}`);
            return;
        }
        
        await device.ping(); // Update last_seen
        
        if (messageType === 'sensor-data') {
            const data = JSON.parse(message.toString());
            
            await SensorData.createFromDevice(device.device_id, {
                soil_moisture: data.moisture,
                temperature: data.temperature,
                air_humidity: data.humidity,
                light_intensity: data.light
            });
            
            // Check if any plants need watering
            await checkAutoWatering(device.device_id);
        }
        
    } catch (error) {
        SystemLog.error('IoT', `MQTT message processing error: ${error.message}`);
    }
});

// ESP32 Code Example:
/*
void sendSensorData() {
    float moisture = analogRead(SOIL_SENSOR_PIN) / 1024.0 * 100;
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    float light = analogRead(LIGHT_SENSOR_PIN) / 1024.0 * 100;
    
    String payload = String("{") +
        "\"moisture\":" + moisture + "," +
        "\"temperature\":" + temperature + "," +
        "\"humidity\":" + humidity + "," +
        "\"light\":" + light + "," +
        "\"timestamp\":\"" + getTimestamp() + "\"" +
        "}";
    
    String topic = "devices/" + DEVICE_KEY + "/sensor-data";
    mqttClient.publish(topic.c_str(), payload.c_str());
}
*/
```

### **4.2 Auto-Water Based on Sensors**
**Status**: ✅ Models Ready
- **Description**: Activate pump if sensor threshold or AI prediction reached
- **Preconditions**: Auto mode enabled
- **Postconditions**: Watering completed, log recorded
- **Tech Stack**: Logic if-then, AI integration

```javascript
// Models Available:
const { Plant, WateringHistory, Alert } = require('./models');

async function checkAutoWatering(deviceId) {
    const plants = await Plant.findByDeviceId(deviceId);
    
    for (const plant of plants) {
        if (!plant.auto_watering_on) continue;
        
        const needsWater = await plant.needsWatering();
        const aiPrediction = await getAIPrediction(plant.plant_id);
        
        if (needsWater || (aiPrediction && aiPrediction.should_water)) {
            await triggerWatering(plant, aiPrediction ? 'ai_prediction' : 'automatic_threshold');
        }
    }
}

async function triggerWatering(plant, triggerType) {
    const duration = calculateWateringDuration(plant);
    
    // Send MQTT command to device
    const device = await Device.findById(plant.device_id);
    const command = {
        action: 'start_pump',
        duration: duration,
        plant_id: plant.plant_id
    };
    
    client.publish(`devices/${device.device_key}/pump-control`, JSON.stringify(command));
    
    // Log watering event
    await WateringHistory.logWatering(plant.plant_id, triggerType, duration);
    
    // Create notification
    await Alert.createPlantAlert(
        plant.user_id,
        plant.custom_name,
        'watering_started',
        `Auto-watering activated (${triggerType})`
    );
    
    SystemLog.info('IoT', `Auto-watering triggered for plant ${plant.plant_id}`);
}

// ESP32 Code Example:
/*
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    String message = "";
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    if (String(topic).endsWith("/pump-control")) {
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, message);
        
        if (doc["action"] == "start_pump") {
            int duration = doc["duration"];
            activatePump(duration);
            
            // Send confirmation
            String confirmTopic = "devices/" + DEVICE_KEY + "/pump-status";
            String confirmPayload = "{\"status\":\"started\",\"duration\":" + String(duration) + "}";
            mqttClient.publish(confirmTopic.c_str(), confirmPayload.c_str());
        }
    }
}

void activatePump(int duration) {
    digitalWrite(PUMP_PIN, HIGH);
    delay(duration * 1000);
    digitalWrite(PUMP_PIN, LOW);
    
    // Send completion status
    String topic = "devices/" + DEVICE_KEY + "/pump-status";
    String payload = "{\"status\":\"completed\",\"duration\":" + String(duration) + "}";
    mqttClient.publish(topic.c_str(), payload.c_str());
}
*/
```

### **4.3 Handle Hardware Failure**
**Status**: ✅ Models Ready
- **Description**: Detect errors, send alerts, enter safe mode
- **Preconditions**: Error occurs
- **Postconditions**: Alert sent, pump disabled
- **Tech Stack**: Watchdog timer, MQTT error topic

```javascript
// Models Available:
const { Device, Alert, SystemLog } = require('./models');

// MQTT Error Handling
client.on('message', async (topic, message) => {
    if (topic.includes('/error')) {
        const [, deviceKey] = topic.split('/');
        const device = await Device.findByDeviceKey(deviceKey);
        const errorData = JSON.parse(message.toString());
        
        await handleDeviceError(device, errorData);
    }
});

async function handleDeviceError(device, errorData) {
    // Update device status
    await device.updateStatus('error');
    
    // Get all plants for this device
    const plants = await Plant.findByDeviceId(device.device_id);
    
    for (const plant of plants) {
        // Disable auto-watering for safety
        plant.auto_watering_on = false;
        await plant.save();
        
        // Create alert for user
        await Alert.createPlantAlert(
            plant.user_id,
            plant.custom_name,
            'device_offline',
            `Device error: ${errorData.error_message}`
        );
    }
    
    // Log system error
    await SystemLog.error('IoT', `Device ${device.device_id} error: ${errorData.error_message}`);
    
    // Send safe mode command
    client.publish(`devices/${device.device_key}/safe-mode`, JSON.stringify({
        action: 'enter_safe_mode',
        disable_pump: true
    }));
}

// Device heartbeat monitoring
setInterval(async () => {
    const devices = await Device.findByStatus('online');
    
    for (const device of devices) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (device.last_seen < fiveMinutesAgo) {
            await device.updateStatus('offline');
            
            const plants = await Plant.findByDeviceId(device.device_id);
            for (const plant of plants) {
                await Alert.createPlantAlert(
                    plant.user_id,
                    plant.custom_name,
                    'device_offline',
                    'Device has gone offline'
                );
            }
        }
    }
}, 60000); // Check every minute

// ESP32 Watchdog and Error Handling:
/*
#include "esp_system.h"
#include "esp_task_wdt.h"

void setup() {
    // Enable watchdog timer
    esp_task_wdt_init(30, true); // 30 seconds timeout
    esp_task_wdt_add(NULL);
    
    // Error monitoring
    setupErrorHandlers();
}

void loop() {
    // Reset watchdog
    esp_task_wdt_reset();
    
    // Check for errors
    if (sensorError() || pumpError() || wifiError()) {
        enterSafeMode();
        sendErrorReport();
    }
    
    // Normal operation
    readSensors();
    sendData();
    checkPumpCommands();
    
    delay(5000);
}

void enterSafeMode() {
    digitalWrite(PUMP_PIN, LOW); // Ensure pump is off
    digitalWrite(ERROR_LED_PIN, HIGH);
    
    String errorTopic = "devices/" + DEVICE_KEY + "/error";
    String errorPayload = "{\"error_message\":\"Hardware failure detected\",\"safe_mode\":true}";
    mqttClient.publish(errorTopic.c_str(), errorPayload.c_str());
}
*/
```

---

## 🛠️ **Implementation Priority**

### **Phase 1: Core Functionality (Weeks 1-2)**
1. ✅ Password reset (Completed)
2. 🟡 Dashboard and sensor data display
3. 🟡 Manual watering control
4. 🟡 Basic auto-watering schedules

### **Phase 2: Premium Features (Weeks 3-4)**
1. 🔴 Payment integration (VNPay)
2. 🔴 Advanced reporting
3. 🔴 Multi-zone management
4. 🔴 AI chatbot integration

### **Phase 3: AI and Analytics (Weeks 5-6)**
1. 🔴 AI prediction models
2. 🔴 Plant health analysis
3. 🔴 Schedule optimization
4. 🔴 Advanced analytics

### **Phase 4: Admin and IoT (Weeks 7-8)**
1. 🔴 Admin dashboard
2. 🔴 System monitoring
3. 🔴 IoT device management
4. 🔴 Backup/restore functionality

---

## 🚀 **Technology Stack Summary**

### **Backend**
- ✅ Node.js + Express
- ✅ PostgreSQL with comprehensive models
- ✅ JWT authentication
- 🟡 MQTT for IoT communication
- 🔴 AI/ML services (Python Flask)

### **Frontend**
- 🔴 React.js (to be implemented)
- 🔴 Chart.js for data visualization
- 🔴 WebSocket for real-time updates
- 🔴 Drag-and-drop dashboard

### **IoT**
- 🔴 ESP32 microcontrollers
- 🔴 MQTT broker (Mosquitto)
- 🔴 Sensor integration
- 🔴 Pump control systems

### **AI/ML**
- 🔴 Python TensorFlow/scikit-learn
- 🔴 OpenAI API for chatbot
- 🔴 Weather API integration
- 🔴 ML model deployment

### **Payment**
- ✅ VNPay integration (models ready)
- 🔴 Payment flow implementation

---

## 📝 **Next Steps**

1. **Implement Authentication Flow** - Complete login/logout (if needed)
2. **Build Frontend Dashboard** - React components for data visualization
3. **Set up MQTT Broker** - IoT device communication
4. **Develop AI Services** - Python microservices for predictions
5. **Create Admin Interface** - System management tools
6. **Integrate Payment Gateway** - VNPay payment flow
7. **Deploy and Test** - End-to-end testing and deployment

This development guide provides a complete roadmap for implementing all 31 use cases with the existing model foundation. Each use case includes technical details, implementation status, and code examples to guide development.
