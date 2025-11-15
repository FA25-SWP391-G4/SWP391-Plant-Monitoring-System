#!/usr/bin/env node

/**
 * This script installs the dependencies required for the notification system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing notification system dependencies...');

// Define dependencies
const dependencies = [
  'socket.io',           // WebSocket support
  'firebase-admin',      // Push notifications
  'nodemailer',          // Email notifications
];

// Check if package.json exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found. Please run this script from the root of the project.');
  process.exit(1);
}

// Install dependencies
try {
  execSync(`npm install ${dependencies.join(' ')} --save`, { stdio: 'inherit' });
  console.log('Dependencies installed successfully.');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

// Create .env template if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envTemplatePath = path.join(__dirname, '..', '.env.template');

if (!fs.existsSync(envPath) && !fs.existsSync(envTemplatePath)) {
  console.log('Creating .env.template file...');
  
  const envContent = `# Firebase Cloud Messaging (FCM) configuration
# If using a service account JSON file:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Email configuration for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Plant Monitoring System <no-reply@plant-system.com>"

# WebSocket configuration
CORS_ORIGIN=http://localhost:3000
`;

  try {
    fs.writeFileSync(envTemplatePath, envContent);
    console.log('.env.template created. Please update with your actual configuration values.');
  } catch (error) {
    console.error('Error creating .env.template:', error.message);
  }
}

// Run the migrations
try {
  console.log('\nRunning migrations for notification system...');
  
  // Check if we have PostgreSQL available
  try {
    const { Pool } = require('pg');
    const pool = new Pool();
    
    // Read migration file
    const migrationFilePath = path.join(__dirname, '..', 'migrations', 'update_alerts_for_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Applying database migrations...');
    pool.query(migrationSQL)
      .then(() => {
        console.log('Migrations applied successfully.');
        pool.end();
      })
      .catch(err => {
        console.error('Error applying migrations:', err.message);
        console.log('You may need to apply the migrations manually. See migrations/update_alerts_for_notifications.sql');
        pool.end();
      });
  } catch (error) {
    console.log('PostgreSQL client not available. You need to apply migrations manually:');
    console.log('1. Connect to your PostgreSQL database');
    console.log('2. Run the SQL in migrations/update_alerts_for_notifications.sql');
  }
} catch (error) {
  console.error('Error running migrations:', error.message);
}

console.log('\nNotification system setup complete!');
console.log('Next steps:');
console.log('1. Configure your .env file with Firebase and SMTP settings');
console.log('2. Restart your application to enable WebSocket notifications');
console.log('3. Update your frontend to connect to the WebSocket server');
console.log('\nSee docs/NOTIFICATION_IMPLEMENTATION.md for integration details');