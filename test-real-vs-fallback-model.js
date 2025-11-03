/**
 * Test and Compare Real vs Fallback Disease Recognition Models
 * Validates the performance improvement with the real trained model
 */

const { DiseaseRecognitionModel } = require('./ai_models/disease_recognition/index');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('🔬 Testing Real vs Fallback Disease Recognition Models...\n');

class ModelComparison {
    constructor() {
        this.testImages = [];
        this.results = {
            real: [],
            fallback: []
        };
    }

    /**
     * Create test images for different disease types
     */
    async createTestImages() {
        console.log('🎨 Creating test images for disease recognition...');
        
        const diseases = [
            { name: 'Healthy', color: { r: 40, g: 180, b: 40 } },
            { name: 'Early Blight', color: { r: 139, g: 69, b: 19 } },
            { name: 'Late Blight', color: { r: 120, g: 60, b: 15 } },
            { name: 'Leaf Spot', color: { r: 160, g: 82, b: 45 } },
            { name: 'Powdery Mildew', color: { r: 220, g: 220, b: 220 } },
            { name: 'Yellowing', color: { r: 255, g: 215, b: 0 } },
            { name: 'Wilting', color: { r: 101, g: 67, b: 33 } }
        ];

        for (const disease of diseases) {
            // Create multiple variations of each disease
            for (let i = 0; i < 3; i++) {
                const variation = {
                    r: Math.max(0, Math.min(255, disease.color.r + (Math.random() - 0.5) * 40)),
                    g: Math.max(0, Math.min(255, disease.color.g + (Math.random() - 0.5) * 40)),
                    b: Math.max(0, Math.min(255, disease.color.b + (Math.random() - 0.5) * 40))
                };

                const imageBuffer = await sharp({
                    create: {
                        width: 224,
                        height: 224,
                        channels: 3,
                        background: variation
                    }
                })
                .png()
                .toBuffer();

                this.testImages.push({
                    name: `${disease.name}_${i + 1}`,
                    expectedDisease: disease.name,
                    buffer: imageBuffer
                });
            }
        }

        console.log(`✅ Created ${this.testImages.length} test images`);
    }

    /**
     * Test model with real trained model (if available)
     */
    async testRealModel() {
        console.log('\n🚀 Testing with Real Trained Model...');
        
        // Check if real model exists
        const modelPath = path.join(__dirname, 'ai_models', 'disease_recognition', 'model.json');
        const classesPath = path.join(__dirname, 'ai_models', 'disease_recognition', 'classes.json');
        
        if (!fs.existsSync(modelPath) || !fs.existsSync(classesPath)) {
            console.log('⚠️  Real trained model not found, skipping real model test');
            return null;
        }

        const diseaseModel = new DiseaseRecognitionModel();
        
        try {
            await diseaseModel.initialize();
            
            const startTime = Date.now();
            
            for (const testImage of this.testImages) {
                const result = await diseaseModel.analyzeImage(testImage.buffer);
                
                this.results.real.push({
                    imageName: testImage.name,
                    expected: testImage.expectedDisease,
                    predicted: result.analysis.diseaseDetected,
                    confidence: result.analysis.confidence,
                    correct: this.isCorrectPrediction(testImage.expectedDisease, result.analysis.diseaseDetected),
                    processingTime: result.analysis.processingTime || 0
                });
            }
            
            const totalTime = Date.now() - startTime;
            
            diseaseModel.dispose();
            
            console.log(`✅ Real model testing completed in ${totalTime}ms`);
            return this.calculateMetrics(this.results.real);
            
        } catch (error) {
            console.error('❌ Real model test failed:', error.message);
            diseaseModel.dispose();
            return null;
        }
    }

    /**
     * Test model with fallback model
     */
    async testFallbackModel() {
        console.log('\n🔄 Testing with Fallback Model...');
        
        // Temporarily rename real model files to force fallback
        const modelPath = path.join(__dirname, 'ai_models', 'disease_recognition', 'model.json');
        const classesPath = path.join(__dirname, 'ai_models', 'disease_recognition', 'classes.json');
        const modelBackup = modelPath + '.backup';
        const classesBackup = classesPath + '.backup';
        
        let backedUp = false;
        
        try {
            // Backup real model files if they exist
            if (fs.existsSync(modelPath)) {
                fs.renameSync(modelPath, modelBackup);
                backedUp = true;
            }
            if (fs.existsSync(classesPath)) {
                fs.renameSync(classesPath, classesBackup);
            }
            
            const diseaseModel = new DiseaseRecognitionModel();
            await diseaseModel.initialize();
            
            const startTime = Date.now();
            
            for (const testImage of this.testImages) {
                const result = await diseaseModel.analyzeImage(testImage.buffer);
                
                this.results.fallback.push({
                    imageName: testImage.name,
                    expected: testImage.expectedDisease,
                    predicted: result.analysis.diseaseDetected,
                    confidence: result.analysis.confidence,
                    correct: this.isCorrectPrediction(testImage.expectedDisease, result.analysis.diseaseDetected),
                    processingTime: result.analysis.processingTime || 0
                });
            }
            
            const totalTime = Date.now() - startTime;
            
            diseaseModel.dispose();
            
            console.log(`✅ Fallback model testing completed in ${totalTime}ms`);
            
            // Restore real model files
            if (backedUp && fs.existsSync(modelBackup)) {
                fs.renameSync(modelBackup, modelPath);
            }
            if (fs.existsSync(classesBackup)) {
                fs.renameSync(classesBackup, classesPath);
            }
            
            return this.calculateMetrics(this.results.fallback);
            
        } catch (error) {
            console.error('❌ Fallback model test failed:', error.message);
            
            // Restore files on error
            if (backedUp && fs.existsSync(modelBackup)) {
                fs.renameSync(modelBackup, modelPath);
            }
            if (fs.existsSync(classesBackup)) {
                fs.renameSync(classesBackup, classesPath);
            }
            
            return null;
        }
    }

    /**
     * Check if prediction is correct (allows for similar diseases)
     */
    isCorrectPrediction(expected, predicted) {
        if (expected === predicted) return true;
        
        // Allow for similar disease classifications
        const similarDiseases = {
            'Early Blight': ['Late Blight', 'Leaf Spot'],
            'Late Blight': ['Early Blight', 'Leaf Spot'],
            'Leaf Spot': ['Early Blight', 'Late Blight'],
            'Powdery Mildew': ['Other/Unknown'],
            'Yellowing': ['Mosaic Virus'],
            'Mosaic Virus': ['Yellowing']
        };
        
        return similarDiseases[expected]?.includes(predicted) || false;
    }

    /**
     * Calculate performance metrics
     */
    calculateMetrics(results) {
        const total = results.length;
        const correct = results.filter(r => r.correct).length;
        const accuracy = correct / total;
        
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;
        const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / total;
        
        // Calculate per-disease accuracy
        const diseaseAccuracy = {};
        const diseases = [...new Set(results.map(r => r.expected))];
        
        diseases.forEach(disease => {
            const diseaseResults = results.filter(r => r.expected === disease);
            const diseaseCorrect = diseaseResults.filter(r => r.correct).length;
            diseaseAccuracy[disease] = diseaseCorrect / diseaseResults.length;
        });
        
        return {
            total,
            correct,
            accuracy,
            avgConfidence,
            avgProcessingTime,
            diseaseAccuracy
        };
    }

    /**
     * Display comparison results
     */
    displayResults(realMetrics, fallbackMetrics) {
        console.log('\n📊 Model Comparison Results\n');
        console.log('=' .repeat(60));
        
        if (realMetrics) {
            console.log('🚀 Real Trained Model:');
            console.log(`   Overall Accuracy: ${(realMetrics.accuracy * 100).toFixed(1)}%`);
            console.log(`   Average Confidence: ${(realMetrics.avgConfidence * 100).toFixed(1)}%`);
            console.log(`   Average Processing Time: ${realMetrics.avgProcessingTime.toFixed(0)}ms`);
            console.log(`   Correct Predictions: ${realMetrics.correct}/${realMetrics.total}`);
        }
        
        if (fallbackMetrics) {
            console.log('\n🔄 Fallback Model:');
            console.log(`   Overall Accuracy: ${(fallbackMetrics.accuracy * 100).toFixed(1)}%`);
            console.log(`   Average Confidence: ${(fallbackMetrics.avgConfidence * 100).toFixed(1)}%`);
            console.log(`   Average Processing Time: ${fallbackMetrics.avgProcessingTime.toFixed(0)}ms`);
            console.log(`   Correct Predictions: ${fallbackMetrics.correct}/${fallbackMetrics.total}`);
        }
        
        if (realMetrics && fallbackMetrics) {
            console.log('\n📈 Improvement with Real Model:');
            const accuracyImprovement = ((realMetrics.accuracy - fallbackMetrics.accuracy) * 100).toFixed(1);
            const confidenceImprovement = ((realMetrics.avgConfidence - fallbackMetrics.avgConfidence) * 100).toFixed(1);
            
            console.log(`   Accuracy: ${accuracyImprovement > 0 ? '+' : ''}${accuracyImprovement}%`);
            console.log(`   Confidence: ${confidenceImprovement > 0 ? '+' : ''}${confidenceImprovement}%`);
            
            if (realMetrics.accuracy > fallbackMetrics.accuracy) {
                console.log('   ✅ Real model performs better!');
            } else {
                console.log('   ⚠️  Fallback model performs similarly');
            }
        }
        
        console.log('\n🔍 Per-Disease Accuracy:');
        if (realMetrics) {
            console.log('   Real Model:');
            Object.entries(realMetrics.diseaseAccuracy).forEach(([disease, acc]) => {
                console.log(`     ${disease}: ${(acc * 100).toFixed(1)}%`);
            });
        }
        
        if (fallbackMetrics) {
            console.log('   Fallback Model:');
            Object.entries(fallbackMetrics.diseaseAccuracy).forEach(([disease, acc]) => {
                console.log(`     ${disease}: ${(acc * 100).toFixed(1)}%`);
            });
        }
        
        console.log('=' .repeat(60));
    }

    /**
     * Run complete comparison test
     */
    async runComparison() {
        try {
            await this.createTestImages();
            
            const realMetrics = await this.testRealModel();
            const fallbackMetrics = await this.testFallbackModel();
            
            this.displayResults(realMetrics, fallbackMetrics);
            
            // Save detailed results
            const detailedResults = {
                timestamp: new Date().toISOString(),
                realModel: {
                    metrics: realMetrics,
                    results: this.results.real
                },
                fallbackModel: {
                    metrics: fallbackMetrics,
                    results: this.results.fallback
                }
            };
            
            fs.writeFileSync('model-comparison-results.json', JSON.stringify(detailedResults, null, 2));
            console.log('\n💾 Detailed results saved to model-comparison-results.json');
            
            return {
                realModel: realMetrics,
                fallbackModel: fallbackMetrics,
                improvement: realMetrics && fallbackMetrics ? 
                    realMetrics.accuracy - fallbackMetrics.accuracy : 0
            };
            
        } catch (error) {
            console.error('❌ Comparison test failed:', error.message);
            throw error;
        }
    }
}

// Run comparison if called directly
async function runModelComparison() {
    const comparison = new ModelComparison();
    return await comparison.runComparison();
}

if (require.main === module) {
    runModelComparison().catch(console.error);
}

module.exports = { runModelComparison };