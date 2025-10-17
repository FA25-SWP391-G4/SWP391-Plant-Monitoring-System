const fs = require('fs');
const path = require('path');

/**
 * Setup uploads directory structure for image recognition
 */
function setupUploadsDirectory() {
    const uploadsDir = path.join(__dirname, 'uploads');
    const imagesDir = path.join(uploadsDir, 'images');
    
    try {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Created uploads directory');
        }
        
        // Create images subdirectory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
            console.log('✅ Created uploads/images directory');
        }
        
        // Create .gitkeep file to ensure directory is tracked
        const gitkeepPath = path.join(imagesDir, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '');
            console.log('✅ Created .gitkeep file');
        }
        
        // Create .gitignore to ignore uploaded files but keep directory
        const gitignorePath = path.join(imagesDir, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            fs.writeFileSync(gitignorePath, '# Ignore all uploaded images\n*.jpg\n*.jpeg\n*.png\n*.webp\n*.tiff\n*.gif\n\n# Keep .gitkeep\n!.gitkeep\n!.gitignore\n');
            console.log('✅ Created .gitignore file');
        }
        
        console.log('🎉 Uploads directory setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up uploads directory:', error);
        process.exit(1);
    }
}

// Run setup
setupUploadsDirectory();