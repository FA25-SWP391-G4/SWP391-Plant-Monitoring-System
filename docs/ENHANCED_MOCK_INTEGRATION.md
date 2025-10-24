# Enhanced Device Mock Integration

## Overview
This document describes the integration of the enhanced device mock with the dashboard and health calculation system. The enhanced device mock provides realistic sensor data in the same format as real IoT devices, which is then used to calculate plant health metrics.

## Components Implemented

### 1. Plant Health Calculator (`plantHealthCalculator.js`)
A new utility that calculates plant health based on sensor data from devices. It considers:
- Soil moisture levels
- Temperature readings
- Air humidity levels
- Light intensity

The health calculator provides:
- An overall health score (0-100)
- Individual factor scores for moisture, temperature, humidity, and light
- Plant status determination (healthy, needs_attention, stressed, critical, dying)

### 2. Enhanced Dynamic Plant Mock (`dynamicPlantMock.js`)
Updated to:
- Use the enhanced device mock for realistic sensor data
- Integrate with the plant health calculator
- Store health metrics in the database
- Update plant status based on calculated health

### 3. Dashboard Mock Controller (`dashboardMockController.js`)
Enhanced with:
- Integration of real-time data from enhanced device mock
- New endpoints for health history and real-time device data
- Historical health data access through the database

### 4. Database Schema (`health-history-table.sql`)
Created a new table to store detailed plant health history:
- Overall health scores
- Individual factor scores
- Timestamps for trend analysis

## New Endpoints

1. **Dashboard Overview**
   - Path: `/api/mock/dashboard/overview`
   - Now includes health history and real-time device data

2. **Plant Health History**
   - Path: `/api/mock/dashboard/plant-health`
   - Returns detailed health history with factor breakdowns

3. **Real-time Device Data**
   - Path: `/api/mock/dashboard/realtime-data`
   - Returns the latest data from the enhanced device mock

## Health Calculation Logic

The health calculation algorithm takes into account:

1. **Soil Moisture (45% weight)**:
   - Critical: Below 70% of threshold
   - Low: Between 70-100% of threshold
   - Optimal: Between 100-150% of threshold
   - Too Wet: Between 150-200% of threshold
   - Over-watered: Above 200% of threshold

2. **Temperature (25% weight)**:
   - Optimal: In the middle of the min-max range
   - Scores decrease as temperature moves toward or beyond limits

3. **Humidity (15% weight)**:
   - Optimal: In the middle of the min-max range
   - Scores decrease as humidity moves toward or beyond limits

4. **Light Intensity (15% weight)**:
   - Too Dark: Below minimum threshold
   - Optimal: Between minimum and 120% of maximum threshold
   - Too Bright: Above 120% of maximum threshold

## Integration Testing

A test script (`test-enhanced-mock.js`) has been created to validate the integration:
- Tests all new endpoints
- Verifies the presence of real-time data
- Checks health calculation results

## Future Enhancements

1. **Trend Analysis**: Implement more sophisticated trend analysis for health prediction
2. **Anomaly Detection**: Add algorithms to detect unusual patterns in sensor data
3. **Plant-specific Thresholds**: Refine thresholds based on specific plant species
4. **Mobile Alerts**: Send notifications when health drops below certain thresholds