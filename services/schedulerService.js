const cron = require('node-cron');
const PumpSchedule = require('../models/PumpSchedule');
const Device = require('../models/Device');
const SystemLog = require('../models/SystemLog');
const { sendPumpCommand } = require('../mqtt/mqttClient');

const activeCronJobs = new Map(); // key: schedule_id, value: cron job

/**
 * Schedule a single pump
 */
async function schedulePump(schedule) {
  // Only schedule active schedules
  if (!schedule || !schedule.is_active) return;

  // Cancel existing job if present
  if (activeCronJobs.has(schedule.schedule_id)) {
    const existingJob = activeCronJobs.get(schedule.schedule_id);
    existingJob.stop();
    activeCronJobs.delete(schedule.schedule_id);
  }

  // Create a new cron job. The callback should be small and non-blocking.
  const job = cron.schedule(
    schedule.cron_expression,
    async () => {
    console.log(`⏰ Triggering pump for schedule_id=${schedule.schedule_id}`);
    try {
        // Use sendDeviceCommand abstraction to send pump command via MQTT
        // duration_seconds defaults to 10s when not provided.
        await sendDeviceCommand(schedule.plant_id, 'pump_on', {
          duration: schedule.duration_seconds || 10
        });
      console.log(`✅ Pump triggered for schedule_id=${schedule.schedule_id}`);
    } catch (err) {
        // Always catch inside cron handler to prevent unhandled rejections
        console.error(`❌ Failed to trigger pump for schedule_id=${schedule.schedule_id}:`, err.message || err);
    }
    },
    {
      timezone: 'Asia/Ho_Chi_Minh' // adjust as appropriate for your deployment
    }
  );

  // Keep track of the running job so we can stop it later if needed.
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


/**
 * Send a compact schedule command to a device over MQTT.
 * This is used for syncing device-local schedule configuration (e.g. when
 * the device stores and executes schedules itself).
 */
async function sendScheduleToDevice(deviceId, day, hour, minute, duration) {
  try {
    const parameters = { day, hour, minute, duration };

    console.log('MQTT → Sending schedule to device:', deviceId, parameters);

    // sendDeviceCommand is expected to return an ACK or throw on error
    const result = await sendDeviceCommand(deviceId, 'set_schedule', parameters);
      
    console.log('MQTT → ACK:', result);
    } catch (err) {
    // Log the error but do not crash the scheduler service
    console.error('Failed to send schedule command:', err);
    }
}

/**
 * Remove a schedule dynamically
 */
function removeSchedule(scheduleId) {
  const job = activeCronJobs.get(schedule_idToKey(scheduleId));
  if (job) {
    job.stop();
    activeCronJobs.delete(schedule_idToKey(scheduleId));
    console.log(`🗑️ Schedule ${scheduleId} removed`);
  }
}


// Helper to normalize schedule ids used as map keys. In some DBs the id
// might be numeric or string; ensure a consistent key format.
function schedule_idToKey(id) {
  return String(id);
}


module.exports = {
  scheduleAllPumps,
  schedulePump,
  sendScheduleToDevice,
  updateSchedule,
  removeSchedule
};
