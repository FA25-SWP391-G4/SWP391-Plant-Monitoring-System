// Try to use TensorFlow.js Node, fallback to browser version
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (error) {
    console.warn('TensorFlow.js Node not available, using browser version');
    tf = require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-backend-cpu');
}

/**
 * Improved Disease Recognition Model with better architecture and simulated training
 */
class ImprovedDiseaseModel {
    constructor() {
        this.model = null;
        this.isLoaded = false;
        this.classes = [
            'Healthy',
            'Early Blight',
            'Late Blight',
            'Leaf Spot',
            'Powdery Mildew',
            'Rust',
            'Bacterial Spot',
            'Mosaic Virus',
            'Yellowing',
            'Wilting',
            'Other/Unknown'
        ];
    }

    /**
     * Create improved model architecture based on MobileNetV2
     */
    async createImprovedModel() {
        console.log('🏗️  Creating improved disease recognition model...');
        
        // Create MobileNetV2-inspired architecture
        const model = tf.sequential();
        
        // Input layer
        model.add(tf.layers.inputLayer({ inputShape: [224, 224, 3] }));
        
        // Initial convolution
        model.add(tf.layers.conv2d({
            filters: 32,
            kernelSize: 3,
            strides: 2,
            padding: 'same',
            activation: 'relu',
            name: 'initial_conv'
        }));
        model.add(tf.layers.batchNormalization());
        
        // Inverted residual blocks (simplified MobileNetV2 style)
        const blockConfigs = [
            { filters: 16, strides: 1, expansion: 1 },
            { filters: 24, strides: 2, expansion: 6 },
            { filters: 32, strides: 2, expansion: 6 },
            { filters: 64, strides: 2, expansion: 6 },
            { filters: 96, strides: 1, expansion: 6 },
            { filters: 160, strides: 2, expansion: 6 },
            { filters: 320, strides: 1, expansion: 6 }
        ];
        
        for (let i = 0; i < blockConfigs.length; i++) {
            const config = blockConfigs[i];
            model.add(this.createInvertedResidualBlock(config, `block_${i}`));
        }
        
        // Final layers
        model.add(tf.layers.conv2d({
            filters: 1280,
            kernelSize: 1,
            activation: 'relu',
            name: 'final_conv'
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.globalAveragePooling2d());
        
        // Classification head
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({
            units: this.classes.length,
            activation: 'softmax',
            name: 'predictions'
        }));
        
        // Compile model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        this.model = model;
        console.log('✅ Improved model created');
        console.log('📊 Model summary:');
        model.summary();
        
        return model;
    }
    
    /**
     * Create simplified inverted residual block
     */
    createInvertedResidualBlock(config, name) {
        const { filters, strides, expansion } = config;
        
        return tf.sequential({
            layers: [
                // Expansion
                tf.layers.conv2d({
                    filters: filters * expansion,
                    kernelSize: 1,
                    activation: 'relu',
                    name: `${name}_expand`
                }),
                tf.layers.batchNormalization(),
                
                // Depthwise
                tf.layers.depthwiseConv2d({
                    kernelSize: 3,
                    strides: strides,
                    padding: 'same',
                    activation: 'relu',
                    name: `${name}_depthwise`
                }),
                tf.layers.batchNormalization(),
                
                // Projection
                tf.layers.conv2d({
                    filters: filters,
                    kernelSize: 1,
                    name: `${name}_project`
                }),
                tf.layers.batchNormalization()
            ],
            name: name
        });
    }
    
    /**
     * Simulate training with realistic patterns
     */
    async simulateTraining() {
        if (!this.model) {
            await this.createImprovedModel();
        }
        
        console.log('🎯 Simulating training with realistic disease patterns...');
        
        // Create synthetic training data with disease-specific patterns
        const batchSize = 32;
        const numBatches = 10;
        
        for (let batch = 0; batch < numBatches; batch++) {
            const { images, labels } = this.generateSyntheticBatch(batchSize);
            
            // Train on batch
            const history = await this.model.fit(images, labels, {
                epochs: 1,
                verbose: 0
            });
            
            if (batch % 3 === 0) {
                console.log(`📈 Batch ${batch + 1}/${numBatches} - Loss: ${history.history.loss[0].toFixed(4)}, Accuracy: ${history.history.acc[0].toFixed(4)}`);
            }
            
            // Cleanup
            images.dispose();
            labels.dispose();
        }
        
        console.log('✅ Simulated training completed');
        this.isLoaded = true;
    }
    
    /**
     * Generate synthetic training batch with disease-specific patterns
     */
    generateSyntheticBatch(batchSize) {
        // Create realistic image patterns for different diseases
        const images = tf.randomNormal([batchSize, 224, 224, 3]);
        const labels = tf.zeros([batchSize, this.classes.length]);
        
        // Add disease-specific patterns
        const diseasePatterns = {
            0: [0.2, 0.8, 0.2], // Healthy - more green
            1: [0.6, 0.4, 0.2], // Early Blight - brown spots
            2: [0.4, 0.3, 0.2], // Late Blight - dark patches
            3: [0.5, 0.6, 0.3], // Leaf Spot - spotted pattern
            4: [0.7, 0.7, 0.7], // Powdery Mildew - white coating
            5: [0.8, 0.4, 0.2], // Rust - orange/rust color
            6: [0.3, 0.5, 0.2], // Bacterial Spot - dark spots
            7: [0.6, 0.8, 0.4], // Mosaic Virus - mottled pattern
            8: [0.9, 0.9, 0.3], // Yellowing - yellow leaves
            9: [0.4, 0.3, 0.2], // Wilting - brown/dried
            10: [0.5, 0.5, 0.5] // Other/Unknown - neutral
        };
        
        // Set labels and modify images based on disease type
        for (let i = 0; i < batchSize; i++) {
            const diseaseIndex = Math.floor(Math.random() * this.classes.length);
            
            // Set one-hot label
            labels.bufferSync().set(1, i, diseaseIndex);
            
            // Modify image to have disease-specific color patterns
            const pattern = diseasePatterns[diseaseIndex];
            if (pattern) {
                const imageSlice = images.slice([i, 0, 0, 0], [1, 224, 224, 3]);
                const modifiedImage = imageSlice.mul(tf.tensor(pattern).reshape([1, 1, 1, 3]));
                
                // Update the batch
                const updatedBatch = images.bufferSync();
                const modifiedData = modifiedImage.dataSync();
                
                for (let j = 0; j < modifiedData.length; j++) {
                    const pixelIndex = Math.floor(j / 3);
                    const channelIndex = j % 3;
                    const row = Math.floor(pixelIndex / 224);
                    const col = pixelIndex % 224;
                    updatedBatch.set(modifiedData[j], i, row, col, channelIndex);
                }
                
                imageSlice.dispose();
                modifiedImage.dispose();
            }
        }
        
        return { images, labels };
    }
    
    /**
     * Make prediction with improved confidence calculation
     */
    async predict(imageTensor) {
        if (!this.model || !this.isLoaded) {
            throw new Error('Improved model not loaded. Call simulateTraining() first.');
        }
        
        const reshapedTensor = imageTensor.shape.length === 3 
            ? imageTensor.expandDims(0) 
            : imageTensor;
        
        const predictions = await this.model.predict(reshapedTensor);
        const predictionData = await predictions.data();
        
        // Apply temperature scaling for better confidence calibration
        const temperature = 1.5;
        const scaledPredictions = Array.from(predictionData).map(p => Math.pow(p, 1/temperature));
        const sum = scaledPredictions.reduce((a, b) => a + b, 0);
        const calibratedPredictions = scaledPredictions.map(p => p / sum);
        
        const results = this.classes.map((className, index) => ({
            disease: className,
            confidence: calibratedPredictions[index],
            severity: this.calculateSeverity(calibratedPredictions[index])
        }));
        
        results.sort((a, b) => b.confidence - a.confidence);
        
        // Cleanup
        predictions.dispose();
        if (reshapedTensor !== imageTensor) {
            reshapedTensor.dispose();
        }
        
        return {
            topPrediction: results[0],
            allPredictions: results,
            modelVersion: 'v1.1.0-improved',
            modelType: 'improved_cnn'
        };
    }
    
    /**
     * Calculate disease severity with improved logic
     */
    calculateSeverity(confidence) {
        if (confidence < 0.4) return 'uncertain';
        if (confidence < 0.6) return 'mild';
        if (confidence < 0.8) return 'moderate';
        return 'severe';
    }
    
    /**
     * Get model performance metrics
     */
    getModelMetrics() {
        if (!this.model) return null;
        
        return {
            totalParams: this.model.countParams(),
            trainableParams: this.model.countParams(),
            layers: this.model.layers.length,
            inputShape: [224, 224, 3],
            outputShape: [this.classes.length],
            architecture: 'MobileNetV2-inspired',
            trained: this.isLoaded
        };
    }
    
    /**
     * Dispose model and free memory
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.isLoaded = false;
    }
}

module.exports = ImprovedDiseaseModel;