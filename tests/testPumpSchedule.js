// 1️⃣ Set DB env vars BEFORE any require
process.env.DATABASE_URL = 'postgresql://postgres:123456@localhost:5432/plant_system';
process.env.PGUSER = 'postgres';
process.env.PGPASSWORD = '123456';
process.env.PGHOST = 'localhost';
process.env.PGPORT = '5432';
process.env.PGDATABASE = 'plant_system';

// 2️⃣ Now require any module that depends on DB
const cron = require('node-cron');
const { sendPumpCommand } = require('../mqtt/mqttClient');
const PumpSchedule = require('../models/PumpSchedule'); // if you want real schedules

async function testPump() {
  console.log('🚀 Starting MQTT pump test (no DB)');

  // Schedule 10 seconds from now
  const now = new Date();
  let seconds = now.getSeconds() + 10;
  let minutes = now.getMinutes();
  let hours = now.getHours();

  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
    if (minutes >= 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    }
  }

  const cronExpr = `${minutes} ${hours} * * *`;
  console.log(`⏰ Cron expression: ${cronExpr} (pump will trigger in ~10 seconds)`);

  const task = cron.schedule(cronExpr, async () => {
    console.log('⏰ Running scheduled pump test now!');
    try {
      const result = await sendPumpCommand('TEST_DEVICE_KEY', 'pump_on', 5);
      console.log('✅ Pump command result:', result);
    } catch (err) {
      console.error('❌ Error sending pump command:', err);
    } finally {
      task.stop();
      console.log('🛑 Test finished, cron job stopped');
    }
  });

  console.log('📝 Cron job scheduled');
}

testPump();
