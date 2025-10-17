const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Installing AI Service Dependencies...\n');

// Check if ai_service directory exists
const aiServicePath = './ai_service';
if (!fs.existsSync(aiServicePath)) {
    console.log('❌ ai_service directory not found');
    process.exit(1);
}

// Check if package.json exists
const packageJsonPath = path.join(aiServicePath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found in ai_service directory');
    process.exit(1);
}

try {
    // Change to ai_service directory
    process.chdir(aiServicePath);
    console.log('📁 Changed to directory:', process.cwd());
    
    // Install dependencies
    console.log('🔄 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\n✅ Dependencies installed successfully!');
    
    // Verify installation
    console.log('\n🔍 Verifying installation...');
    const nodeModulesPath = './node_modules';
    if (fs.existsSync(nodeModulesPath)) {
        console.log('✅ node_modules directory created');
        
        // Check for key dependencies
        const keyDeps = ['express', 'cors', 'helmet', 'axios', 'dotenv'];
        keyDeps.forEach(dep => {
            const depPath = path.join(nodeModulesPath, dep);
            if (fs.existsSync(depPath)) {
                console.log(`✅ ${dep} installed`);
            } else {
                console.log(`❌ ${dep} missing`);
            }
        });
    } else {
        console.log('❌ node_modules directory not found');
    }
    
} catch (error) {
    console.log('\n❌ Installation failed:');
    console.log(error.message);
    process.exit(1);
}