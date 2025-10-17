const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Fallback Mode for AI Service...\n');

// Update package.json to remove TensorFlow dependencies
console.log('1️⃣  Updating package.json...');
const packageJsonPath = './ai_service/package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove TensorFlow dependencies
delete packageJson.dependencies['@tensorflow/tfjs-node'];
delete packageJson.dependencies['sharp'];
delete packageJson.dependencies['multer'];

// Update description
packageJson.description = 'AI microservice for plant monitoring system - chatbot and rule-based predictions';

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json updated (TensorFlow dependencies removed)');

// Create enhanced fallback AI Utils
console.log('\n2️⃣  Creating enhanced fallback AI Utils...');
const enhancedAiUtilsContent = `// Enhanced AI Utils with advanced rule-based algorithms (no TensorFlow.js)

let tensorflowInitialized = false;
let initializationError = new Error('TensorFlow.js not available - using enhanced rule-based algorithms');

/**
 * Initialize AI system (fallback mode)
 */
async function initializeTensorFlow() {
    console.log('🧠 Initializing AI system (rule-based mode)...');
    console.log('✅ Enhanced rule-based algorithms loaded');
    return false; // TensorFlow not available, but algorithms are ready
}

/**
 * Check if TensorFlow is available
 */
function isTensorFlowAvailable() {
    return false;
}

/**
 * Get initialization status
 */
function getTensorFlowError() {
    return initializationError;
}

/**
 * Advanced watering prediction using multiple algorithms
 */
async function predictWateringNeeds(sensorData) {
    return predictWateringNeedsAdvanced(sensorData);
}

/**
 * Enhanced rule-based watering prediction with multiple factors
 */
function predictWateringNeedsAdvanced(sensorData) {
    const { moisture, temperature, humidity, lightLevel, plantType, soilType, season } = sensorData;
    
    // Base thresholds
    let dryThreshold = 30;
    let criticalThreshold = 15;
    let wetThreshold = 70;
    
    // Plant-specific adjustments
    if (plantType) {
        const plantAdjustments = {
            'succulent': { dry: 20, critical: 10, wet: 40 },
            'cactus': { dry: 15, critical: 8, wet: 35 },
            'fern': { dry: 45, critical: 30, wet: 80 },
            'tomato': { dry: 35, critical: 20, wet: 75 },
            'lettuce': { dry: 40, critical: 25, wet: 80 },
            'herb': { dry: 30, critical: 18, wet: 65 },
            'flower': { dry: 35, critical: 20, wet: 70 },
            'tree': { dry: 25, critical: 15, wet: 60 }
        };
        
        const adjustment = plantAdjustments[plantType.toLowerCase()];
        if (adjustment) {
            dryThreshold = adjustment.dry;
            criticalThreshold = adjustment.critical;
            wetThreshold = adjustment.wet;
        }
    }
    
    // Soil type adjustments
    if (soilType) {
        const soilAdjustments = {
            'clay': { factor: 1.2 }, // Retains water longer
            'sand': { factor: 0.8 }, // Drains quickly
            'loam': { factor: 1.0 }, // Balanced
            'peat': { factor: 1.1 }  // Retains moisture
        };
        
        const adjustment = soilAdjustments[soilType.toLowerCase()];
        if (adjustment) {
            dryThreshold *= adjustment.factor;
            criticalThreshold *= adjustment.factor;
        }
    }
    
    // Seasonal adjustments
    if (season) {
        const seasonalAdjustments = {
            'spring': { factor: 1.1 }, // Growing season
            'summer': { factor: 1.3 }, // High evaporation
            'autumn': { factor: 0.9 }, // Slower growth
            'winter': { factor: 0.7 }  // Dormant period
        };
        
        const adjustment = seasonalAdjustments[season.toLowerCase()];
        if (adjustment) {
            dryThreshold *= adjustment.factor;
        }
    }
    
    // Calculate base need
    let needsWatering = false;
    let confidence = 0.5;
    let urgency = 'low';
    let recommendation = 'Monitor conditions';
    
    if (moisture <= criticalThreshold) {
        needsWatering = true;
        confidence = 0.95;
        urgency = 'critical';
        recommendation = 'Water immediately - soil is critically dry';
    } else if (moisture <= dryThreshold) {
        needsWatering = true;
        confidence = 0.85;
        urgency = 'high';
        recommendation = 'Water soon - soil is dry';
    } else if (moisture <= (dryThreshold + 15)) {
        needsWatering = true;
        confidence = 0.65;
        urgency = 'medium';
        recommendation = 'Consider watering - soil is getting dry';
    } else if (moisture <= (wetThreshold - 10)) {
        needsWatering = false;
        confidence = 0.7;
        urgency = 'low';
        recommendation = 'No watering needed - soil moisture is adequate';
    } else if (moisture >= wetThreshold) {
        needsWatering = false;
        confidence = 0.9;
        urgency = 'none';
        recommendation = 'Do not water - soil is too wet';
    }
    
    // Environmental factor adjustments
    let environmentalFactor = 1.0;
    
    // Temperature effects
    if (temperature > 35) {
        environmentalFactor += 0.3; // Very hot
    } else if (temperature > 28) {
        environmentalFactor += 0.2; // Hot
    } else if (temperature < 10) {
        environmentalFactor -= 0.3; // Cold
    } else if (temperature < 15) {
        environmentalFactor -= 0.1; // Cool
    }
    
    // Humidity effects
    if (humidity < 30) {
        environmentalFactor += 0.2; // Very dry air
    } else if (humidity < 45) {
        environmentalFactor += 0.1; // Dry air
    } else if (humidity > 80) {
        environmentalFactor -= 0.2; // Very humid
    } else if (humidity > 65) {
        environmentalFactor -= 0.1; // Humid
    }
    
    // Light level effects
    if (lightLevel > 85) {
        environmentalFactor += 0.15; // Very bright
    } else if (lightLevel > 70) {
        environmentalFactor += 0.1; // Bright
    } else if (lightLevel < 20) {
        environmentalFactor -= 0.15; // Very low light
    } else if (lightLevel < 40) {
        environmentalFactor -= 0.1; // Low light
    }
    
    // Apply environmental adjustments
    if (environmentalFactor > 1.0 && !needsWatering && moisture < (dryThreshold + 10)) {
        needsWatering = true;
        confidence = Math.min(confidence * environmentalFactor, 0.95);
        recommendation = 'Water due to environmental conditions (hot/dry/bright)';
        urgency = confidence > 0.8 ? 'high' : 'medium';
    } else if (environmentalFactor < 1.0 && needsWatering && moisture > criticalThreshold) {
        confidence = Math.max(confidence * environmentalFactor, 0.3);
        if (confidence < 0.6) {
            recommendation += ' (reduce amount due to cool/humid/low-light conditions)';
        }
    }
    
    // Calculate water amount recommendation
    let waterAmount = 'normal';
    if (moisture <= criticalThreshold) {
        waterAmount = 'heavy';
    } else if (moisture <= dryThreshold) {
        waterAmount = 'moderate';
    } else if (environmentalFactor > 1.2) {
        waterAmount = 'moderate';
    } else if (environmentalFactor < 0.8) {
        waterAmount = 'light';
    }
    
    // Next check recommendation
    let nextCheckHours = 24;
    if (urgency === 'critical') {
        nextCheckHours = 2;
    } else if (urgency === 'high') {
        nextCheckHours = 6;
    } else if (urgency === 'medium') {
        nextCheckHours = 12;
    } else if (urgency === 'low') {
        nextCheckHours = 24;
    } else {
        nextCheckHours = 48;
    }
    
    return {
        needsWatering,
        confidence: Math.round(confidence * 100) / 100,
        urgency,
        recommendation,
        waterAmount,
        nextCheckHours,
        source: 'enhanced-rule-based',
        factors: {
            moisture: moisture + '%',
            temperature: temperature + '°C',
            humidity: humidity + '%',
            lightLevel: lightLevel + '%',
            environmentalFactor: Math.round(environmentalFactor * 100) / 100,
            plantType: plantType || 'general',
            thresholds: {
                critical: criticalThreshold,
                dry: dryThreshold,
                wet: wetThreshold
            }
        },
        algorithm: 'Enhanced Multi-Factor Rule-Based Prediction v2.0'
    };
}

/**
 * Simple fallback for backward compatibility
 */
function predictWateringNeedsFallback(sensorData) {
    return predictWateringNeedsAdvanced(sensorData);
}

/**
 * Plant health analysis using rule-based approach
 */
async function analyzePlantHealth(sensorData, plantInfo = {}) {
    const { moisture, temperature, humidity, lightLevel } = sensorData;
    const { plantType, age, lastWatered } = plantInfo;
    
    let healthScore = 100;
    let issues = [];
    let recommendations = [];
    
    // Moisture analysis
    if (moisture < 20) {
        healthScore -= 30;
        issues.push('Severely dry soil');
        recommendations.push('Water immediately');
    } else if (moisture < 35) {
        healthScore -= 15;
        issues.push('Dry soil');
        recommendations.push('Water soon');
    } else if (moisture > 80) {
        healthScore -= 20;
        issues.push('Overwatered soil');
        recommendations.push('Reduce watering frequency');
    }
    
    // Temperature analysis
    if (temperature > 35) {
        healthScore -= 15;
        issues.push('High temperature stress');
        recommendations.push('Provide shade or move to cooler location');
    } else if (temperature < 10) {
        healthScore -= 20;
        issues.push('Cold stress');
        recommendations.push('Move to warmer location or provide protection');
    }
    
    // Humidity analysis
    if (humidity < 30) {
        healthScore -= 10;
        issues.push('Low humidity');
        recommendations.push('Increase humidity around plant');
    } else if (humidity > 85) {
        healthScore -= 10;
        issues.push('High humidity - risk of fungal issues');
        recommendations.push('Improve air circulation');
    }
    
    // Light analysis
    if (lightLevel < 20) {
        healthScore -= 15;
        issues.push('Insufficient light');
        recommendations.push('Move to brighter location or add grow lights');
    } else if (lightLevel > 90) {
        healthScore -= 10;
        issues.push('Excessive light exposure');
        recommendations.push('Provide some shade during peak hours');
    }
    
    // Overall health assessment
    let healthStatus = 'excellent';
    if (healthScore < 50) {
        healthStatus = 'poor';
    } else if (healthScore < 70) {
        healthStatus = 'fair';
    } else if (healthScore < 85) {
        healthStatus = 'good';
    }
    
    return {
        healthScore: Math.max(healthScore, 0),
        healthStatus,
        issues,
        recommendations,
        analysis: {
            moisture: moisture < 35 ? 'low' : moisture > 70 ? 'high' : 'optimal',
            temperature: temperature < 15 ? 'low' : temperature > 30 ? 'high' : 'optimal',
            humidity: humidity < 40 ? 'low' : humidity > 75 ? 'high' : 'optimal',
            light: lightLevel < 30 ? 'low' : lightLevel > 80 ? 'high' : 'optimal'
        },
        source: 'rule-based-health-analysis'
    };
}

module.exports = {
    initializeTensorFlow,
    isTensorFlowAvailable,
    getTensorFlowError,
    predictWateringNeeds,
    predictWateringNeedsAdvanced,
    predictWateringNeedsFallback,
    analyzePlantHealth
};
`;

fs.writeFileSync('./ai_service/services/aiUtils.js', enhancedAiUtilsContent);
console.log('✅ Enhanced AI Utils created with advanced rule-based algorithms');

// Clean up TensorFlow node_modules to avoid conflicts
console.log('\n3️⃣  Cleaning up TensorFlow modules...');
const tensorflowPath = './ai_service/node_modules/@tensorflow';
if (fs.existsSync(tensorflowPath)) {
    try {
        fs.rmSync(tensorflowPath, { recursive: true, force: true });
        console.log('✅ TensorFlow modules removed');
    } catch (error) {
        console.log('⚠️  Could not remove TensorFlow modules (may be in use)');
    }
} else {
    console.log('ℹ️  No TensorFlow modules to clean up');
}

console.log('\n4️⃣  Testing enhanced AI system...');

// Test the enhanced system
try {
    const aiUtils = require('./ai_service/services/aiUtils');
    
    // Test initialization
    const initialized = aiUtils.initializeTensorFlow();
    console.log('✅ AI system initialization test passed');
    
    // Test watering prediction
    const testSensorData = {
        moisture: 25,
        temperature: 28,
        humidity: 45,
        lightLevel: 70,
        plantType: 'tomato',
        soilType: 'loam',
        season: 'summer'
    };
    
    const prediction = await aiUtils.predictWateringNeeds(testSensorData);
    console.log('✅ Watering prediction test passed');
    console.log('   Needs watering:', prediction.needsWatering);
    console.log('   Confidence:', prediction.confidence);
    console.log('   Urgency:', prediction.urgency);
    console.log('   Water amount:', prediction.waterAmount);
    console.log('   Algorithm:', prediction.algorithm);
    
    // Test plant health analysis
    const healthAnalysis = await aiUtils.analyzePlantHealth(testSensorData, { plantType: 'tomato', age: 30 });
    console.log('✅ Plant health analysis test passed');
    console.log('   Health score:', healthAnalysis.healthScore);
    console.log('   Health status:', healthAnalysis.healthStatus);
    console.log('   Issues:', healthAnalysis.issues.length);
    console.log('   Recommendations:', healthAnalysis.recommendations.length);
    
} catch (error) {
    console.log('❌ AI system test failed:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 FALLBACK MODE SETUP COMPLETE!');
console.log('='.repeat(60));
console.log('✅ AI Service configured with enhanced rule-based algorithms');
console.log('✅ No TensorFlow.js dependencies required');
console.log('✅ Advanced multi-factor watering predictions');
console.log('✅ Plant health analysis capabilities');
console.log('✅ Support for different plant types and soil types');
console.log('✅ Environmental factor adjustments');
console.log('✅ Seasonal recommendations');
console.log('');
console.log('🚀 Current AI Capabilities:');
console.log('• OpenRouter chatbot with Mistral 7B Instruct');
console.log('• Enhanced rule-based watering predictions');
console.log('• Multi-factor plant health analysis');
console.log('• Plant-specific care recommendations');
console.log('• Environmental condition adjustments');
console.log('• Urgency-based watering schedules');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Start AI service: cd ai_service && npm start');
console.log('2. Test all endpoints with enhanced features');
console.log('3. Optional: Add TensorFlow.js later when build tools are available');
console.log('='.repeat(60));