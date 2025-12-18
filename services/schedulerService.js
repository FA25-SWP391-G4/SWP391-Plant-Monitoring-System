/**
 * Scheduler service
 * -----------------
 * This module manages pump schedules stored in the database and maps them
 * to in-memory cron jobs using `node-cron`. It also provides a helper to
 * send schedule definitions to devices over MQTT.
 *
 * Key responsibilities:
 * - Load schedules from DB and activate corresponding cron jobs
 * - Add / update / remove schedules at runtime when the DB changes
 * - Trigger pump actions at scheduled times by calling the device/mqtt
 *
 * Concurrency / lifecycle notes:
 * - `activeCronJobs` holds the running cron.Job instances so they can be
 *   stopped and removed when a schedule is updated or deleted.
 * - Cron callbacks should be quick and non-blocking; they call `sendPumpCommand`
 *   which is async. Errors are caught and logged to avoid crashing the scheduler.
 * - Timezone is set explicitly when scheduling. If your deployment spans
 *   timezones or uses DST, validate the cron expressions and timezone choice.
 */

const cron = require('node-cron');
const PumpSchedule = require('../models/PumpSchedule');
const { sendDeviceCommand } = require('../mqtt/mqttClient');

// Map of active cron jobs keyed by schedule_id. This makes it easy to
// stop/remove the previous job when a schedule is updated or disabled.
const activeCronJobs = new Map(); // key: schedule_id, value: cron job


/**
 * Schedule a single pump based on a schedule object from the DB.
 *
 * Expected `schedule` shape (common fields):
 * {
 *   schedule_id: <number|string>,
 *   plant_id: <number|string>,
 *   cron_expression: <string>, // cron format understood by node-cron
 *   duration_seconds: <number>, // optional, default applied if missing
 *   is_active: <boolean>
 * }
 */
async function schedulePump(schedule) {
  // Only schedule active schedules
  if (!schedule || !schedule.is_active) return;

  // If a job already exists for this schedule, stop and remove it first.
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
 * Load all schedules from the database and activate them.
 * This is typically called on service startup so persisted schedules become active.
 */
async function scheduleAllPumps() {
  const allSchedules = await PumpSchedule.findAll();
  for (const schedule of allSchedules) {
    // updateSchedule will handle skipping inactive schedules and prevent duplicates
    await updateSchedule(schedule.schedule_id);
  }
}


/**
 * Add or update a schedule by id. This function fetches the latest schedule
 * from the DB and either schedules it or removes it if disabled.
 *
 * Call this function when the DB changes (create / update / toggle active).
 */
async function updateSchedule(scheduleId) {
  const schedule = await PumpSchedule.findById(scheduleId);

  // If schedule doesn't exist or is disabled, ensure it's removed from memory
  if (!schedule || !schedule.is_active) {
    removeSchedule(scheduleId);
    return;
  }

  // Remove any existing cron job and re-create based on the current schedule
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
 * Remove a schedule and stop its cron job if running.
 * This does not delete the DB row — it's the in-memory cancellation.
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

