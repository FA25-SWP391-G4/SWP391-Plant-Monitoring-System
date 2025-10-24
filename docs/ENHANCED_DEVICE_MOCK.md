# Enhanced Device Mock Service Documentation

## Overview

The Enhanced Device Mock Service provides realistic device simulation data that matches the format from real IoT devices in the plant monitoring system. This service is designed to facilitate development and testing without requiring physical sensor hardware.

## Device Data Format

The enhanced mock service generates data in the following format, matching the real device format:

```json
{
  "messageType": "sensor",
  "deviceId": 3,
  "timestamp": "2025-10-22T03:36:24Z",
  "soil_moisture": 100,
  "temperature": 26.4,
  "air_humidity": 78.2,
  "light_intensity": 0,
  "pump": "OFF",
  "thresholds": {
    "soil": 35,
    "light": 20000,
    "tempMin": 18,
    "tempMax": 30,
    "humidityMax": 70
  }
}
```

## API Endpoints

### 1. Get Mock Device Data

```
GET /api/mock/device/device
```

Query Parameters:
- `deviceId` (optional): The device ID to simulate (defaults to 3)

Response Example:
```json
{
  "messageType": "sensor",
  "deviceId": 3,
  "timestamp": "2025-10-23T14:28:15Z",
  "soil_moisture": 78.5,
  "temperature": 24.3,
  "air_humidity": 65.2,
  "light_intensity": 12500,
  "pump": "OFF",
  "thresholds": {
    "soil": 35,
    "light": 20000,
    "tempMin": 18,
    "tempMax": 30,
    "humidityMax": 70
  }
}
```

### 2. Get Mock Watering Event

```
GET /api/mock/device/watering
```

Query Parameters:
- `deviceId` (optional): The device ID to simulate (defaults to 3)

Response Example:
```json
{
  "messageType": "watering",
  "deviceId": 3,
  "timestamp": "2025-10-23T14:30:22Z",
  "pump": "ON",
  "duration": 8,
  "amount_ml": 240
}
```

### 3. Get Mock Alarm Event

```
GET /api/mock/device/alarm
```

Query Parameters:
- `deviceId` (optional): The device ID to simulate (defaults to 3)
- `type` (optional): The alarm type ('moisture', 'temperature', 'humidity', 'light', defaults to 'moisture')

Response Example:
```json
{
  "messageType": "alarm",
  "deviceId": 3,
  "timestamp": "2025-10-23T14:32:15Z",
  "type": "moisture",
  "value": 25,
  "threshold": 35,
  "message": "Low soil moisture detected"
}
```

## Integration with Dynamic Plant Mock

The Enhanced Device Mock has been integrated with the Dynamic Plant Mock service to provide consistent data across the simulation. When the dynamic mock generates new sensor data, it now uses the enhanced device mock format.

## Usage in Development

1. **For direct API testing**:
   Access the endpoints directly in your browser or API client:
   - `http://localhost:3000/api/mock/device/device`
   - `http://localhost:3000/api/mock/device/watering`
   - `http://localhost:3000/api/mock/device/alarm?type=temperature`

2. **For integration testing**:
   The dashboard mock API now uses the enhanced device format, making it compatible with front-end components expecting real device data.

3. **For WebSocket testing**:
   You can simulate real-time device data using these mock endpoints as data sources.

## Implementation Details

- `enhancedDeviceMock.js` - Core service that generates the mock data
- `enhancedMockController.js` - Controller with API endpoints
- `enhancedMockRoutes.js` - Express router for the endpoints
- Integration with `dynamicPlantMock.js` for consistent simulation