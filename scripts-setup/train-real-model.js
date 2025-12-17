const RealModelTrainer = require('./ai_models/disease_recognition/realModelTrainer');

/**
 * Script to train a real plant disease recognition model
 */
async function trainRealModel() {
    console.log('🚀 Real Plant Disease Model Training Script\n');
    console.log('=' .repeat(60));
    
    try {
        const trainer = new RealModelTrainer();
        
        // Step 1: Show training instructions
        console.log('📋 TRAINING INSTRUCTIONS:');
        const instructions = trainer.getTrainingInstructions();
        
        console.log('\n🔧 Steps to Follow:');
        instructions.steps.forEach((step, index) => {
            console.log(`  ${step}`);
        });
        
        console.log('\n📊 Requirements:');
        instructions.requirements.forEach(req => {
            console.log(`  • ${req}`);
        });
        
        console.log('\n📥 Dataset Sources:');
        instructions.datasetSources.forEach(source => {
            console.log(`  • ${source}`);
        });
        
        // Step 2: Setup dataset structure
        console.log('\n📁 Setting up dataset structure...');
        const datasetResult = await trainer.downloadPlantVillageDataset();
        
        if (datasetResult.success) {
            console.log('✅ Dataset structure created successfully');
            console.log(`📂 Dataset path: ${datasetResult.datasetPath}`);
        }
        
        // Step 3: Check if images are available
        console.log('\n🔍 Checking for training images...');
        try {
            const trainingData = await trainer.loadTrainingData();
            
            if (trainingData.totalSamples > 0) {
                console.log(`✅ Found ${trainingData.totalSamples} training images`);
                
                if (trainingData.totalSamples < 100) {
                    console.log('⚠️ WARNING: Very few images found. Model performance will be poor.');
                    console.log('   Please add more images to the dataset directories.');
                    console.log('   Recommended: At least 100 images per disease class.');
                    
                    // Ask user if they want to continue
                    console.log('\n❓ Do you want to continue training with limited data? (y/N)');
                    // In a real scenario, you'd use readline for user input
                    console.log('   Skipping training due to insufficient data...');
                    return;
                }
                
                // Step 4: Start training
                console.log('\n🏋️ Starting model training...');
                console.log('⏰ This may take several hours depending on your hardware.');
                
                const trainingResult = await trainer.trainModel();
                
                if (trainingResult.success) {
                    console.log('\n🎉 Training completed successfully!');
                    console.log(`📊 Final Accuracy: ${(trainingResult.finalAccuracy * 100).toFixed(2)}%`);
                    console.log(`📊 Final Loss: ${trainingResult.finalLoss.toFixed(4)}`);
                    console.log(`📂 Model saved to: ${trainingResult.modelPath}`);
                    
                    // Step 5: Evaluate model
                    console.log('\n📊 Evaluating model performance...');
                    const evaluation = await trainer.evaluateModel();
                    console.log(`📈 Model Accuracy: ${evaluation.accuracyPercent}%`);
                    
                    // Step 6: Integration instructions
                    console.log('\n🔧 INTEGRATION INSTRUCTIONS:');
                    console.log('  1. The trained model is saved in ai_models/disease_recognition/trained_models/');
                    console.log('  2. Update enhancedModelLoader.js to load the real model');
                    console.log('  3. Replace the fallback model with your trained model');
                    console.log('  4. Test the model with real plant images');
                    console.log('  5. Deploy to production when satisfied with performance');
                    
                } else {
                    console.log('❌ Training failed. Check the logs above for details.');
                }
                
            } else {
                console.log('❌ No training images found!');
                console.log('\n📋 TO ADD TRAINING DATA:');
                console.log('  1. Download PlantVillage dataset from Kaggle');
                console.log('  2. Or collect your own plant disease images');
                console.log('  3. Organize images into the following directories:');
                
                trainer.diseaseClasses.forEach(diseaseClass => {
                    console.log(`     - ai_models/disease_recognition/datasets/plant_village/${diseaseClass}/`);
                });
                
                console.log('\n💡 TIP: Each directory should contain 100+ images of that disease type');
            }
            
            // Clean up tensors
            if (trainingData.images) trainingData.images.dispose();
            if (trainingData.labels) trainingData.labels.dispose();
            
        } catch (dataError) {
            console.log('⚠️ No training data available yet');
            console.log('   Please add images to the dataset directories first');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY:');
        console.log('✅ Dataset structure created');
        console.log('📁 Ready to accept training images');
        console.log('📖 Follow the instructions above to train your model');
        
        console.log('\n🔗 USEFUL LINKS:');
        console.log('  • PlantVillage Dataset: https://www.kaggle.com/emmarex/plantdisease');
        console.log('  • Plant Pathology 2020: https://www.kaggle.com/c/plant-pathology-2020-fgvc7');
        console.log('  • TensorFlow.js Guide: https://www.tensorflow.org/js/guide/train_models');
        
    } catch (error) {
        console.error('❌ Error in training script:', error);
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('  1. Ensure TensorFlow.js is properly installed');
        console.log('  2. Check that you have enough disk space');
        console.log('  3. Verify image files are not corrupted');
        console.log('  4. Try reducing batch size if running out of memory');
    }
}

// Run the training script
if (require.main === module) {
    trainRealModel()
        .then(() => {
            console.log('\n✨ Training script completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Training script failed:', error);
            process.exit(1);
        });
}

module.exports = trainRealModel;