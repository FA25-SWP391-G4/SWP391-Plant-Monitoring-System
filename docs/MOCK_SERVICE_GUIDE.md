# Plant Monitoring System - Dynamic Mock Service

This module provides a realistic mock data service for the plant monitoring system dashboard. It generates dynamic data that changes over time, simulating real plant growth, sensor readings, and environmental changes.

## Overview

The dynamic mock service creates realistic plant data including:

- Plants with various attributes (moisture, light, temperature)
- Sensor readings that change over time
- Watering history with realistic patterns
- User activities
- Watering schedules

The data generated is persistent within a session and will evolve over time to simulate real plant behavior.

## API Endpoints

The mock service provides the following API endpoints:

- `GET /api/mock/dashboard/overview` - Get all dashboard data for a user
- `GET /api/mock/dashboard/sensors` - Get sensor data for plants
- `GET /api/mock/dashboard/watering-history` - Get watering history
- `GET /api/mock/dashboard/activities` - Get user activities
- `GET /api/mock/dashboard/weather` - Get weather data
- `POST /api/mock/dashboard/water/:plantId` - Water a plant manually

## Using the Mock Service

1. Make API requests to the `/api/mock/dashboard/` endpoints for development
2. The mock service will provide realistic data that changes over time
3. Interact with the plants (water them) to see real-time changes

## Authentication

For testing purposes, the mock service will use:

- The authenticated user if available
- Default to user ID 1 when no authentication is present

## Data Simulation

The mock service simulates:

1. Plant moisture decreasing naturally over time
2. Plant health changing based on conditions
3. Light levels varying by time of day
4. Temperature fluctuations based on natural patterns
5. Plant growth based on health and conditions

## Example Usage

```javascript
// Get dashboard overview
fetch('/api/mock/dashboard/overview')
  .then(response => response.json())
  .then(data => {
    // Use the data to populate your dashboard
    console.log(data);
  });

// Water a plant
fetch('/api/mock/dashboard/water/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ duration: 10 })
})
  .then(response => response.json())
  .then(data => {
    // Plant watered successfully
    console.log(data);
  });
```

## Developer Notes

The mock service is designed to work alongside the real controllers but provide consistent and realistic data for development and testing without requiring real IoT devices.