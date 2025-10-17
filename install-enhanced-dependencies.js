const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Install enhanced dependencies for improved image recognition
 */
async function installEnhancedDependencies() {
    console.log('📦 Installing enhanced dependencies for image recognition...\n');
    
    const dependencies = [
        'express-rate-limit',
        'express-slow-down', 
        'node-cron',
        'helmet',
        'compression'
    ];
    
    try {
        for (const dep of dependencies) {
            console.log(`📥 Installing ${dep}...`);
            try {
                await execPromise(`npm install ${dep}`);
                console.log(`✅ ${dep} installed successfully`);
            } catch (error) {
                console.log(`⚠️ ${dep} installation failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Enhanced dependencies installation completed!');
        console.log('\n📋 Installed packages:');
        dependencies.forEach(dep => console.log(`  ✅ ${dep}`));
        
        console.log('\n🔧 Additional setup recommendations:');
        console.log('  1. Configure rate limiting in production');
        console.log('  2. Set up file cleanup cron jobs');
        console.log('  3. Configure security headers with helmet');
        console.log('  4. Enable compression for better performance');
        
    } catch (error) {
        console.error('❌ Error installing enhanced dependencies:', error);
    }
}

// Run installation
if (require.main === module) {
    installEnhancedDependencies()
        .then(() => {
            console.log('\n✨ Installation completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Installation failed:', error);
            process.exit(1);
        });
}

module.exports = installEnhancedDependencies;