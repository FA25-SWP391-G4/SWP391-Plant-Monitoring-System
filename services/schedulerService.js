const cron = require('node-cron');
const PumpSchedule = require('../models/PumpSchedule');
const { sendDeviceCommand } = require('../mqtt/mqttClient');

const activeCronJobs = new Map(); // key: schedule_id, value: cron job

/**
 * Schedule a single pump
 */
async function schedulePump(schedule) {
  if (!schedule.is_active) return;

  // Cancel existing job if present
  if (activeCronJobs.has(schedule.schedule_id)) {
    const existingJob = activeCronJobs.get(schedule.schedule_id);
    existingJob.stop();
    activeCronJobs.delete(schedule.schedule_id);
  }

  // Schedule new job
  const job = cron.schedule(schedule.cron_expression, async () => {
    console.log(`⏰ Triggering pump for schedule_id=${schedule.schedule_id}`);
    try {
      await sendPumpCommand(schedule.plant_id, 'pump_on', schedule.duration_seconds || 10);
      console.log(`✅ Pump triggered for schedule_id=${schedule.schedule_id}`);
    } catch (err) {
      console.error(`❌ Failed to trigger pump for schedule_id=${schedule.schedule_id}:`, err.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' }); // Adjust timezone if needed

  activeCronJobs.set(schedule.schedule_id, job);
}

/**
 * Load all active schedules from DB and schedule them
 */

async function scheduleAllPumps() {
  const allSchedules = await PumpSchedule.findAll();
  for (const schedule of allSchedules) {
    await updateSchedule(schedule.schedule_id);
  }
}

/**
 * Dynamically add/update a schedule
 * Call this whenever a schedule is created/updated in DB
 */
async function updateSchedule(scheduleId) {
  const schedule = await PumpSchedule.findById(scheduleId);

  if (!schedule || !schedule.is_active) {
    removeSchedule(scheduleId);
    return;
  }

  // Remove old job if exists
  removeSchedule(scheduleId);
  await schedulePump(schedule);
}

async function sendScheduleToDevice(deviceId, day, hour, minute, duration) {
  try {
    const parameters = { day, hour, minute, duration };

    console.log('MQTT → Sending schedule to device:', deviceId, parameters);

    const result = await sendDeviceCommand(deviceId, 'set_schedule', parameters);

    console.log('MQTT → ACK:', result);
  } catch (err) {
    console.error('Failed to send schedule command:', err);
  }
}

/**
 * Remove a schedule dynamically
 */
function removeSchedule(scheduleId) {
  const job = activeCronJobs.get(scheduleId);
  if (job) {
    job.stop();
    activeCronJobs.delete(scheduleId);
    console.log(`🗑️ Schedule ${scheduleId} removed`);
  }
}

module.exports = {
  scheduleAllPumps,
  schedulePump,
  sendScheduleToDevice,
  updateSchedule,
  removeSchedule
};
