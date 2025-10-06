const SensorData = require('./SensorData');
const Plant = require('./Plant');

class PlantHealthModel {
    constructor() {
        // Ngưỡng chuẩn cho các loại cây
        this.plantTypeThresholds = {
            'herb': {
                soil_moisture: { min: 40, max: 70, weight: 0.3 },
                temperature: { min: 18, max: 26, weight: 0.2 },
                humidity: { min: 40, max: 70, weight: 0.2 },
                light: { min: 300, max: 800, weight: 0.3 }
            },
            'flower': {
                soil_moisture: { min: 50, max: 70, weight: 0.3 },
                temperature: { min: 18, max: 28, weight: 0.2 },
                humidity: { min: 50, max: 80, weight: 0.2 },
                light: { min: 400, max: 900, weight: 0.3 }
            },
            'vegetable': {
                soil_moisture: { min: 60, max: 80, weight: 0.4 },
                temperature: { min: 20, max: 30, weight: 0.2 },
                humidity: { min: 50, max: 80, weight: 0.1 },
                light: { min: 500, max: 1000, weight: 0.3 }
            },
            'fruit': {
                soil_moisture: { min: 50, max: 75, weight: 0.3 },
                temperature: { min: 20, max: 32, weight: 0.3 },
                humidity: { min: 40, max: 70, weight: 0.1 },
                light: { min: 600, max: 1000, weight: 0.3 }
            },
            'tree': {
                soil_moisture: { min: 40, max: 70, weight: 0.3 },
                temperature: { min: 15, max: 30, weight: 0.2 },
                humidity: { min: 30, max: 70, weight: 0.1 },
                light: { min: 400, max: 900, weight: 0.4 }
            },
            'succulent': {
                soil_moisture: { min: 20, max: 40, weight: 0.4 },
                temperature: { min: 18, max: 35, weight: 0.2 },
                humidity: { min: 20, max: 50, weight: 0.1 },
                light: { min: 500, max: 1000, weight: 0.3 }
            },
            'fern': {
                soil_moisture: { min: 60, max: 80, weight: 0.4 },
                temperature: { min: 18, max: 24, weight: 0.2 },
                humidity: { min: 60, max: 90, weight: 0.3 },
                light: { min: 200, max: 500, weight: 0.1 }
            },
            'vine': {
                soil_moisture: { min: 50, max: 70, weight: 0.3 },
                temperature: { min: 18, max: 28, weight: 0.2 },
                humidity: { min: 40, max: 70, weight: 0.2 },
                light: { min: 300, max: 800, weight: 0.3 }
            },
            'aquatic': {
                soil_moisture: { min: 90, max: 100, weight: 0.5 },
                temperature: { min: 20, max: 28, weight: 0.3 },
                humidity: { min: 60, max: 90, weight: 0.1 },
                light: { min: 300, max: 700, weight: 0.1 }
            },
            // Mặc định cho các loại cây khác
            'default': {
                soil_moisture: { min: 40, max: 70, weight: 0.3 },
                temperature: { min: 18, max: 28, weight: 0.2 },
                humidity: { min: 40, max: 70, weight: 0.2 },
                light: { min: 400, max: 800, weight: 0.3 }
            }
        };
        
        // Các vấn đề sức khỏe phổ biến và triệu chứng
        this.healthIssues = {
            'overwatering': {
                conditions: [
                    { param: 'soil_moisture', condition: 'high', threshold: 0.2 }
                ],
                recommendations: [
                    'Giảm tần suất tưới nước',
                    'Đảm bảo đất có khả năng thoát nước tốt',
                    'Kiểm tra hệ thống thoát nước của chậu'
                ]
            },
            'underwatering': {
                conditions: [
                    { param: 'soil_moisture', condition: 'low', threshold: 0.2 }
                ],
                recommendations: [
                    'Tăng tần suất tưới nước',
                    'Tưới nước đều đặn hơn',
                    'Xem xét sử dụng hệ thống tưới tự động'
                ]
            },
            'temperature_stress': {
                conditions: [
                    { param: 'temperature', condition: 'extreme', threshold: 0.3 }
                ],
                recommendations: [
                    'Di chuyển cây đến vị trí có nhiệt độ phù hợp hơn',
                    'Bảo vệ cây khỏi nhiệt độ cực đoan',
                    'Điều chỉnh nhiệt độ môi trường nếu có thể'
                ]
            },
            'low_humidity': {
                conditions: [
                    { param: 'humidity', condition: 'low', threshold: 0.2 }
                ],
                recommendations: [
                    'Phun sương xung quanh cây',
                    'Sử dụng máy tạo độ ẩm',
                    'Đặt cây gần nhau để tạo vi khí hậu ẩm'
                ]
            },
            'high_humidity': {
                conditions: [
                    { param: 'humidity', condition: 'high', threshold: 0.2 }
                ],
                recommendations: [
                    'Tăng lưu thông không khí',
                    'Giảm phun sương',
                    'Tránh đặt cây quá gần nhau'
                ]
            },
            'light_deficiency': {
                conditions: [
                    { param: 'light', condition: 'low', threshold: 0.2 }
                ],
                recommendations: [
                    'Di chuyển cây đến vị trí có nhiều ánh sáng hơn',
                    'Bổ sung đèn trồng cây',
                    'Cắt tỉa cây xung quanh để tăng ánh sáng'
                ]
            },
            'light_excess': {
                conditions: [
                    { param: 'light', condition: 'high', threshold: 0.2 }
                ],
                recommendations: [
                    'Di chuyển cây đến vị trí có ít ánh sáng trực tiếp hơn',
                    'Sử dụng màn che để giảm cường độ ánh sáng',
                    'Đặt cây cách xa cửa sổ hướng nam hoặc tây'
                ]
            },
            'multiple_stress': {
                conditions: [
                    { param: 'multiple', condition: 'extreme', threshold: 0.3 }
                ],
                recommendations: [
                    'Kiểm tra toàn diện điều kiện chăm sóc cây',
                    'Điều chỉnh tất cả các thông số về mức phù hợp',
                    'Theo dõi sát sao sự phục hồi của cây'
                ]
            }
        };
    }

    async analyzeHealth(plantId) {
        try {
            // Lấy thông tin cây trồng
            const plant = await Plant.findById(plantId).exec();
            if (!plant) {
                return { error: 'Không tìm thấy cây trồng' };
            }
            
            // Lấy dữ liệu cảm biến gần đây
            const recentSensorData = await SensorData.find({ plant_id: plantId })
                .sort({ timestamp: -1 })
                .limit(24) // Lấy 24 bản ghi gần nhất
                .exec();
            
            if (recentSensorData.length === 0) {
                return { error: 'Không có dữ liệu cảm biến cho cây trồng này' };
            }
            
            // Tính trung bình các thông số
            const averageData = this._calculateAverageData(recentSensorData);
            
            // Lấy ngưỡng cho loại cây
            const plantType = plant.type.toLowerCase();
            const thresholds = this.plantTypeThresholds[plantType] || this.plantTypeThresholds['default'];
            
            // Tính điểm sức khỏe
            const healthScores = this._calculateHealthScores(averageData, thresholds);
            const overallHealthScore = this._calculateOverallHealthScore(healthScores, thresholds);
            
            // Xác định trạng thái sức khỏe
            const healthStatus = this._determineHealthStatus(overallHealthScore);
            
            // Phát hiện vấn đề
            const issues = this._detectIssues(averageData, thresholds);
            
            // Tạo khuyến nghị
            const recommendations = this._generateRecommendations(issues);
            
            return {
                analysis: {
                    plant_id: plantId,
                    plant_name: plant.name,
                    plant_type: plant.type,
                    health_score: overallHealthScore,
                    status: healthStatus,
                    issues: issues.map(issue => issue.name),
                    recommendations: recommendations,
                    parameter_scores: healthScores,
                    average_data: averageData
                }
            };
        } catch (error) {
            console.error('Lỗi khi phân tích sức khỏe cây trồng:', error);
            return { error: 'Lỗi khi phân tích sức khỏe cây trồng' };
        }
    }

    _calculateAverageData(sensorData) {
        // Tính trung bình các thông số từ dữ liệu cảm biến
        const sum = {
            soil_moisture: 0,
            temperature: 0,
            humidity: 0,
            light: 0
        };
        
        sensorData.forEach(data => {
            sum.soil_moisture += data.soil_moisture;
            sum.temperature += data.temperature;
            sum.humidity += data.humidity;
            sum.light += data.light;
        });
        
        const count = sensorData.length;
        
        return {
            soil_moisture: sum.soil_moisture / count,
            temperature: sum.temperature / count,
            humidity: sum.humidity / count,
            light: sum.light / count,
            latest_timestamp: sensorData[0].timestamp
        };
    }

    _calculateHealthScores(data, thresholds) {
        // Tính điểm sức khỏe cho từng thông số
        const scores = {};
        
        for (const param in thresholds) {
            if (param in data) {
                const value = data[param];
                const { min, max } = thresholds[param];
                
                if (value < min) {
                    // Giá trị thấp hơn ngưỡng tối thiểu
                    scores[param] = 1 - Math.min(1, (min - value) / min);
                } else if (value > max) {
                    // Giá trị cao hơn ngưỡng tối đa
                    scores[param] = 1 - Math.min(1, (value - max) / max);
                } else {
                    // Giá trị trong khoảng lý tưởng
                    const midpoint = (min + max) / 2;
                    const distance = Math.abs(value - midpoint);
                    const range = (max - min) / 2;
                    scores[param] = 1 - (distance / range);
                }
                
                // Đảm bảo điểm nằm trong khoảng [0, 1]
                scores[param] = Math.max(0, Math.min(1, scores[param]));
            }
        }
        
        return scores;
    }

    _calculateOverallHealthScore(scores, thresholds) {
        // Tính điểm sức khỏe tổng thể dựa trên trọng số
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const param in scores) {
            const weight = thresholds[param].weight;
            weightedSum += scores[param] * weight;
            totalWeight += weight;
        }
        
        return weightedSum / totalWeight;
    }

    _determineHealthStatus(healthScore) {
        // Xác định trạng thái sức khỏe dựa trên điểm
        if (healthScore >= 0.8) {
            return 'Rất tốt';
        } else if (healthScore >= 0.6) {
            return 'Tốt';
        } else if (healthScore >= 0.4) {
            return 'Trung bình';
        } else if (healthScore >= 0.2) {
            return 'Kém';
        } else {
            return 'Rất kém';
        }
    }

    _detectIssues(data, thresholds) {
        // Phát hiện các vấn đề sức khỏe
        const issues = [];
        
        // Kiểm tra từng vấn đề
        for (const issueName in this.healthIssues) {
            const issue = this.healthIssues[issueName];
            let issueDetected = false;
            
            // Kiểm tra các điều kiện của vấn đề
            for (const condition of issue.conditions) {
                const { param, condition: condType, threshold } = condition;
                
                if (param === 'multiple') {
                    // Kiểm tra nhiều thông số cùng lúc
                    let extremeCount = 0;
                    for (const p in data) {
                        if (p in thresholds) {
                            const value = data[p];
                            const { min, max } = thresholds[p];
                            
                            if (value < min * 0.7 || value > max * 1.3) {
                                extremeCount++;
                            }
                        }
                    }
                    
                    if (extremeCount >= 2) {
                        issueDetected = true;
                    }
                } else if (param in data && param in thresholds) {
                    const value = data[param];
                    const { min, max } = thresholds[param];
                    
                    if (condType === 'low' && value < min * (1 - threshold)) {
                        issueDetected = true;
                    } else if (condType === 'high' && value > max * (1 + threshold)) {
                        issueDetected = true;
                    } else if (condType === 'extreme' && (value < min * 0.7 || value > max * 1.3)) {
                        issueDetected = true;
                    }
                }
            }
            
            if (issueDetected) {
                issues.push({
                    name: issueName,
                    recommendations: issue.recommendations
                });
            }
        }
        
        return issues;
    }

    _generateRecommendations(issues) {
        // Tạo danh sách khuyến nghị từ các vấn đề
        const recommendations = [];
        
        issues.forEach(issue => {
            issue.recommendations.forEach(rec => {
                if (!recommendations.includes(rec)) {
                    recommendations.push(rec);
                }
            });
        });
        
        return recommendations;
    }
}

module.exports = new PlantHealthModel();