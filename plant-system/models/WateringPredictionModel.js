const Plant = require('./Plant');
const SensorData = require('./SensorData');
const WateringHistory = require('./WateringHistory');

class WateringPredictionModel {
    constructor() {
        // Ngưỡng chuẩn cho các loại cây
        this.plantTypeThresholds = {
            'herb': {
                soil_moisture: { min: 40, max: 70, optimal: 55, weight: 0.4 },
                temperature: { min: 18, max: 26, optimal: 22, weight: 0.2 },
                humidity: { min: 40, max: 70, optimal: 55, weight: 0.2 },
                light: { min: 300, max: 800, optimal: 500, weight: 0.2 }
            },
            'flower': {
                soil_moisture: { min: 50, max: 70, optimal: 60, weight: 0.4 },
                temperature: { min: 18, max: 28, optimal: 23, weight: 0.2 },
                humidity: { min: 50, max: 80, optimal: 65, weight: 0.2 },
                light: { min: 400, max: 900, optimal: 650, weight: 0.2 }
            },
            'vegetable': {
                soil_moisture: { min: 60, max: 80, optimal: 70, weight: 0.5 },
                temperature: { min: 20, max: 30, optimal: 25, weight: 0.2 },
                humidity: { min: 50, max: 80, optimal: 65, weight: 0.1 },
                light: { min: 500, max: 1000, optimal: 750, weight: 0.2 }
            },
            'fruit': {
                soil_moisture: { min: 50, max: 75, optimal: 65, weight: 0.4 },
                temperature: { min: 20, max: 32, optimal: 26, weight: 0.3 },
                humidity: { min: 40, max: 70, optimal: 55, weight: 0.1 },
                light: { min: 600, max: 1000, optimal: 800, weight: 0.2 }
            },
            'tree': {
                soil_moisture: { min: 40, max: 70, optimal: 55, weight: 0.4 },
                temperature: { min: 15, max: 30, optimal: 22, weight: 0.2 },
                humidity: { min: 30, max: 70, optimal: 50, weight: 0.1 },
                light: { min: 400, max: 900, optimal: 650, weight: 0.3 }
            },
            'succulent': {
                soil_moisture: { min: 20, max: 40, optimal: 30, weight: 0.5 },
                temperature: { min: 18, max: 35, optimal: 25, weight: 0.2 },
                humidity: { min: 20, max: 50, optimal: 35, weight: 0.1 },
                light: { min: 500, max: 1000, optimal: 750, weight: 0.2 }
            },
            'default': {
                soil_moisture: { min: 40, max: 70, optimal: 55, weight: 0.4 },
                temperature: { min: 18, max: 28, optimal: 23, weight: 0.2 },
                humidity: { min: 40, max: 70, optimal: 55, weight: 0.2 },
                light: { min: 400, max: 800, optimal: 600, weight: 0.2 }
            }
        };
    }

    async predict(plantId) {
        try {
            // Lấy thông tin cây trồng
            const plant = await Plant.findById(plantId).exec();
            if (!plant) {
                return { error: 'Không tìm thấy cây trồng' };
            }
            
            // Lấy dữ liệu cảm biến mới nhất
            const latestSensorData = await SensorData.findOne({ plant_id: plantId })
                .sort({ timestamp: -1 })
                .exec();
            
            if (!latestSensorData) {
                return { error: 'Không có dữ liệu cảm biến cho cây trồng này' };
            }
            
            // Lấy lần tưới nước gần nhất
            const lastWatering = await WateringHistory.findOne({ plant_id: plantId })
                .sort({ timestamp: -1 })
                .exec();
            
            if (!lastWatering) {
                return { error: 'Không có lịch sử tưới nước cho cây trồng này' };
            }
            
            // Tính thời gian từ lần tưới cuối (giờ)
            const timeSinceLastWatering = (Date.now() - lastWatering.timestamp) / (1000 * 60 * 60);
            
            // Lấy ngưỡng cho loại cây
            const plantType = plant.type.toLowerCase();
            const thresholds = this.plantTypeThresholds[plantType] || this.plantTypeThresholds['default'];
            
            // Tính điểm nhu cầu tưới nước dựa trên các thông số
            const soilMoistureScore = this._calculateParameterScore(
                latestSensorData.soil_moisture,
                thresholds.soil_moisture.min,
                thresholds.soil_moisture.optimal,
                thresholds.soil_moisture.max
            );
            
            const temperatureScore = this._calculateParameterScore(
                latestSensorData.temperature,
                thresholds.temperature.min,
                thresholds.temperature.optimal,
                thresholds.temperature.max
            );
            
            const humidityScore = this._calculateParameterScore(
                latestSensorData.humidity,
                thresholds.humidity.min,
                thresholds.humidity.optimal,
                thresholds.humidity.max
            );
            
            const lightScore = this._calculateParameterScore(
                latestSensorData.light,
                thresholds.light.min,
                thresholds.light.optimal,
                thresholds.light.max
            );
            
            // Tính điểm thời gian (càng lâu không tưới, điểm càng thấp)
            const timeScore = Math.max(0, 1 - (timeSinceLastWatering / 48)); // Giả sử 48 giờ là ngưỡng tối đa
            
            // Tính điểm tổng hợp có trọng số
            const weightedScore = (
                soilMoistureScore * thresholds.soil_moisture.weight +
                temperatureScore * thresholds.temperature.weight +
                humidityScore * thresholds.humidity.weight +
                lightScore * thresholds.light.weight +
                timeScore * 0.3 // Trọng số cho thời gian
            ) / (thresholds.soil_moisture.weight + thresholds.temperature.weight + 
                 thresholds.humidity.weight + thresholds.light.weight + 0.3);
            
            // Xác định nhu cầu tưới nước
            const shouldWater = weightedScore < 0.6; // Ngưỡng quyết định
            const confidence = shouldWater ? (1 - weightedScore) : weightedScore;
            
            // Tính lượng nước đề xuất dựa trên loại cây và kích thước
            const baseAmount = this._getBaseWaterAmount(plantType);
            const sizeMultiplier = this._getSizeMultiplier(plant.size || 'medium');
            const recommendedAmount = Math.round(baseAmount * sizeMultiplier * (1 + (1 - soilMoistureScore) * 0.5));
            
            // Tính thời gian đến lần tưới tiếp theo
            const baseHours = this._getBaseWateringInterval(plantType);
            const hoursToNextWatering = Math.round(baseHours * weightedScore);
            
            // Tính thời gian tưới tiếp theo
            const nextWateringTime = new Date();
            nextWateringTime.setHours(nextWateringTime.getHours() + hoursToNextWatering);
            
            return {
                prediction: {
                    should_water: shouldWater,
                    confidence: confidence,
                    recommended_amount_ml: recommendedAmount,
                    hours_to_next_watering: hoursToNextWatering,
                    next_watering_time: nextWateringTime.toISOString()
                },
                current_data: {
                    soil_moisture: latestSensorData.soil_moisture,
                    temperature: latestSensorData.temperature,
                    humidity: latestSensorData.humidity,
                    light: latestSensorData.light,
                    last_watering: lastWatering.timestamp
                },
                scores: {
                    soil_moisture: soilMoistureScore,
                    temperature: temperatureScore,
                    humidity: humidityScore,
                    light: lightScore,
                    time: timeScore,
                    overall: weightedScore
                }
            };
        } catch (error) {
            console.error('Lỗi khi dự đoán nhu cầu tưới nước:', error);
            return { error: 'Lỗi khi dự đoán nhu cầu tưới nước' };
        }
    }

    _calculateParameterScore(value, min, optimal, max) {
        if (value < min) {
            return Math.max(0, value / min);
        } else if (value > max) {
            return Math.max(0, 1 - (value - max) / max);
        } else if (value < optimal) {
            return 0.5 + 0.5 * ((value - min) / (optimal - min));
        } else {
            return 1 - 0.5 * ((value - optimal) / (max - optimal));
        }
    }

    _getBaseWaterAmount(plantType) {
        // Lượng nước cơ bản (ml) cho mỗi loại cây
        const baseAmounts = {
            'herb': 150,
            'flower': 200,
            'vegetable': 250,
            'fruit': 300,
            'tree': 400,
            'succulent': 100,
            'fern': 200,
            'vine': 250,
            'aquatic': 500,
            'default': 200
        };
        
        return baseAmounts[plantType] || baseAmounts['default'];
    }

    _getSizeMultiplier(size) {
        // Hệ số nhân theo kích thước cây
        const sizeMultipliers = {
            'small': 0.7,
            'medium': 1.0,
            'large': 1.5,
            'extra_large': 2.0
        };
        
        return sizeMultipliers[size] || 1.0;
    }

    _getBaseWateringInterval(plantType) {
        // Khoảng thời gian cơ bản (giờ) giữa các lần tưới nước
        const baseIntervals = {
            'herb': 24,
            'flower': 36,
            'vegetable': 24,
            'fruit': 48,
            'tree': 72,
            'succulent': 168, // 7 ngày
            'fern': 24,
            'vine': 36,
            'aquatic': 12,
            'default': 36
        };
        
        return baseIntervals[plantType] || baseIntervals['default'];
    }
}

module.exports = new WateringPredictionModel();