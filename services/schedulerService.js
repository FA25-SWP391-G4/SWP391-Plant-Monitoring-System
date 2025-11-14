const cron = require('node-cron');
const PumpSchedule = require('../models/PumpSchedule');
const { sendPumpCommand } = require('../mqtt/mqttClient');

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

  const job = cron.schedule(schedule.cron_expression, async () => {
    console.log(`⏰ Running scheduled pump for schedule ${schedule.schedule_id}`);
    try {
      await sendPumpCommand(schedule.device_key, 'pump_on', schedule.duration_seconds);
    } catch (err) {
      console.error('❌ Failed to run scheduled pump:', err);
    }
  });

  scheduledJobs.set(scheduleId, job);
  console.log(`✅ Schedule ${schedule.schedule_id} is now active`);
}

/**
 * Remove a schedule dynamically
 */
function removeSchedule(scheduleId) {
  const job = scheduledJobs.get(scheduleId);
  if (job) {
    job.stop();
    scheduledJobs.delete(scheduleId);
    console.log(`🗑️ Schedule ${scheduleId} removed`);
  }
}

module.exports = {
  scheduleAllPumps,
  schedulePump,
  updateSchedule,
  removeSchedule
};
