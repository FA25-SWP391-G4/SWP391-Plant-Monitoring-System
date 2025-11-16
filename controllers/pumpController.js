const PumpSchedule = require('../models/PumpSchedule');
const schedulerService = require('../services/schedulerService');

app.post('/api/schedules', async (req, res) => {
  try {
    const schedule = new PumpSchedule(req.body);
    await schedule.save();

    // ⚡ Dynamically schedule it
    await schedulerService.updateSchedule(schedule.schedule_id);

    res.status(201).json(schedule.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schedules/:id', async (req, res) => {
  try {
    const schedule = await PumpSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

    Object.assign(schedule, req.body);
    await schedule.save();

    // ⚡ Update the cron job dynamically
    await schedulerService.updateSchedule(schedule.schedule_id);

    res.json(schedule.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    await PumpSchedule.deleteByPlantId(scheduleId); // or your delete method

    // ⚡ Remove cron job
    schedulerService.removeSchedule(scheduleId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//funny debug