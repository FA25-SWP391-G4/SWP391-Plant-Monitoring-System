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
      // Check if device is online before executing
      if (schedule.device_key) {
        const device = await Device.findById(schedule.device_key);
        
        if (!device) {
          console.error(`❌ Device not found for schedule ${schedule.schedule_id}: ${schedule.device_key}`);
          await SystemLog.error('SchedulerService', 
            `Device not found for scheduled watering: ${schedule.device_key}`);
          return;
        }
        
        if (!device.isOnline()) {
          console.warn(`⚠️ Device offline for scheduled watering: ${schedule.device_key}`);
          await SystemLog.create({
            log_level: 'WARN',
            source: 'SchedulerService',
            message: `Skipped scheduled watering - device offline: ${schedule.device_key}`
          });
          return;
        }
        
        console.log(`✅ Device ${schedule.device_key} is online, proceeding with scheduled watering`);
      }
      
      await sendPumpCommand(schedule.device_key, 'pump_on', schedule.duration_seconds);
      
      // Log successful execution
      await SystemLog.create({
        log_level: 'INFO',
        source: 'SchedulerService',
        message: `Scheduled watering executed successfully - Schedule: ${schedule.schedule_id}, Device: ${schedule.device_key}, Duration: ${schedule.duration_seconds}s`
      });
      
      console.log(`✅ Scheduled pump execution completed for schedule ${schedule.schedule_id}`);
    } catch (err) {
      console.error('❌ Failed to run scheduled pump:', err);
      await SystemLog.error('SchedulerService', 
        `Failed scheduled watering execution - Schedule: ${schedule.schedule_id}, Error: ${err.message}`);
    }
  });

  activeCronJobs.set(scheduleId, job);
  console.log(`✅ Schedule ${schedule.schedule_id} is now active with cron: ${schedule.cron_expression}`);
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
  updateSchedule,
  removeSchedule
};
