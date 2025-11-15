const PumpSchedule = require('../../../models/PumpSchedule');
const { pool } = require('../../../config/db');

jest.mock('../../../config/db');

describe('PumpSchedule Model', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn();
    pool.query = mockQuery;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a PumpSchedule instance with valid data', () => {
      const scheduleData = {
        schedule_id: 1,
        plant_id: 10,
        cron_expression: '0 8 * * *',
        is_active: true
      };

      const schedule = new PumpSchedule(scheduleData);

      expect(schedule.schedule_id).toBe(1);
      expect(schedule.plant_id).toBe(10);
      expect(schedule.cron_expression).toBe('0 8 * * *');
      expect(schedule.is_active).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all pump schedules', async () => {
      const mockRows = [
        { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true },
        { schedule_id: 2, plant_id: 11, cron_expression: '0 18 * * *', is_active: false }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const schedules = await PumpSchedule.findAll();

      expect(schedules).toHaveLength(2);
      expect(schedules[0]).toBeInstanceOf(PumpSchedule);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT ps.*'));
    });

    it('should throw error when database query fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(PumpSchedule.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return a pump schedule by ID', async () => {
      const mockRow = { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const schedule = await PumpSchedule.findById(1);

      expect(schedule).toBeInstanceOf(PumpSchedule);
      expect(schedule.schedule_id).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE ps.schedule_id = $1'), [1]);
    });

    it('should return null when schedule is not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const schedule = await PumpSchedule.findById(999);

      expect(schedule).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(PumpSchedule.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByPlantId', () => {
    it('should return all schedules for a plant', async () => {
      const mockRows = [
        { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true },
        { schedule_id: 2, plant_id: 10, cron_expression: '0 18 * * *', is_active: true }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const schedules = await PumpSchedule.findByPlantId(10);

      expect(schedules).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE ps.plant_id = $1'), [10]);
    });
  });

  describe('findByUserId', () => {
    it('should return all schedules for a user', async () => {
      const mockRows = [
        { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const schedules = await PumpSchedule.findByUserId(5);

      expect(schedules).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE u.user_id = $1'), [5]);
    });
  });

  describe('findActive', () => {
    it('should return only active schedules with online devices', async () => {
      const mockRows = [
        { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true, device_status: 'online' }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const schedules = await PumpSchedule.findActive();

      expect(schedules).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("WHERE ps.is_active = true"));
    });
  });

  describe('save', () => {
    it('should create a new schedule when schedule_id is not set', async () => {
      const newSchedule = new PumpSchedule({
        plant_id: 10,
        cron_expression: '0 8 * * *',
        is_active: true
      });

      const mockRow = { schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await newSchedule.save();

      expect(result.schedule_id).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO pump_schedules'),
        [10, '0 8 * * *', true]
      );
    });

    it('should update existing schedule when schedule_id is set', async () => {
      const existingSchedule = new PumpSchedule({
        schedule_id: 1,
        plant_id: 10,
        cron_expression: '0 9 * * *',
        is_active: false
      });

      const mockRow = { schedule_id: 1, plant_id: 10, cron_expression: '0 9 * * *', is_active: false };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await existingSchedule.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE pump_schedules'),
        [10, '0 9 * * *', false, 1]
      );
    });

    it('should default is_active to true when not provided', async () => {
      const newSchedule = new PumpSchedule({
        plant_id: 10,
        cron_expression: '0 8 * * *'
      });

      mockQuery.mockResolvedValue({ rows: [{ schedule_id: 1, is_active: true }] });

      await newSchedule.save();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([true])
      );
    });
  });

  describe('toggleActive', () => {
    it('should toggle is_active from true to false', async () => {
      const schedule = new PumpSchedule({
        schedule_id: 1,
        plant_id: 10,
        cron_expression: '0 8 * * *',
        is_active: true
      });

      mockQuery.mockResolvedValue({ rows: [{ is_active: false }] });

      await schedule.toggleActive();

      expect(schedule.is_active).toBe(false);
      expect(mockQuery).toHaveBeenCalledWith(expect.anything(), [false, 1]);
    });

    it('should toggle is_active from false to true', async () => {
      const schedule = new PumpSchedule({
        schedule_id: 1,
        is_active: false
      });

      mockQuery.mockResolvedValue({ rows: [{ is_active: true }] });

      await schedule.toggleActive();

      expect(schedule.is_active).toBe(true);
    });
  });

  describe('updateCronExpression', () => {
    it('should update cron expression when valid', async () => {
      const schedule = new PumpSchedule({
        schedule_id: 1,
        cron_expression: '0 8 * * *'
      });

      mockQuery.mockResolvedValue({ rows: [{ cron_expression: '0 10 * * *' }] });

      await schedule.updateCronExpression('0 10 * * *');

      expect(schedule.cron_expression).toBe('0 10 * * *');
    });

    it('should throw error for invalid cron expression', async () => {
      const schedule = new PumpSchedule({
        schedule_id: 1,
        cron_expression: '0 8 * * *'
      });

      await expect(schedule.updateCronExpression('invalid')).rejects.toThrow('Invalid cron expression format');
    });
  });

  describe('isValidCronExpression', () => {
    it('should return true for valid cron expression', () => {
      const schedule = new PumpSchedule({});

      expect(schedule.isValidCronExpression('0 8 * * *')).toBe(true);
      expect(schedule.isValidCronExpression('30 14 * * 1')).toBe(true);
    });

    it('should return false for invalid cron expression', () => {
      const schedule = new PumpSchedule({});

      expect(schedule.isValidCronExpression('0 8 *')).toBe(false);
      expect(schedule.isValidCronExpression('')).toBe(false);
      expect(schedule.isValidCronExpression(null)).toBe(false);
      expect(schedule.isValidCronExpression(123)).toBe(false);
    });
  });

  describe('getCronDescription', () => {
    it('should return description for daily schedule at specific hour', () => {
      const schedule = new PumpSchedule({ cron_expression: '0 8 * * *' });
      expect(schedule.getCronDescription()).toBe('Daily at 8:00 AM');
    });

    it('should return description for daily schedule at 6 PM', () => {
      const schedule = new PumpSchedule({ cron_expression: '0 18 * * *' });
      expect(schedule.getCronDescription()).toBe('Daily at 6:00 PM');
    });

    it('should return description for daily schedule with minutes', () => {
      const schedule = new PumpSchedule({ cron_expression: '30 14 * * *' });
      expect(schedule.getCronDescription()).toBe('Daily at 14:30');
    });

    it('should return custom schedule for complex expressions', () => {
      const schedule = new PumpSchedule({ cron_expression: '0 8 * * 1' });
      expect(schedule.getCronDescription()).toBe('Custom schedule: 0 8 * * 1');
    });

    it('should return "No schedule set" when cron_expression is missing', () => {
      const schedule = new PumpSchedule({});
      expect(schedule.getCronDescription()).toBe('No schedule set');
    });

    it('should return "Invalid schedule format" for malformed expression', () => {
      const schedule = new PumpSchedule({ cron_expression: '0 8' });
      expect(schedule.getCronDescription()).toBe('Invalid schedule format');
    });
  });

  describe('delete', () => {
    it('should delete schedule when schedule_id is set', async () => {
      const schedule = new PumpSchedule({ schedule_id: 1 });
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await schedule.delete();

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM Pump_Schedules WHERE schedule_id = $1'),
        [1]
      );
    });

    it('should throw error when schedule_id is not set', async () => {
      const schedule = new PumpSchedule({});

      await expect(schedule.delete()).rejects.toThrow('Cannot delete schedule without ID');
    });
  });

  describe('createDailySchedule', () => {
    it('should create a daily schedule with default minute', async () => {
      mockQuery.mockResolvedValue({ rows: [{ schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * *', is_active: true }] });

      const schedule = await PumpSchedule.createDailySchedule(10, 8);

      expect(schedule.cron_expression).toBe('0 8 * * *');
      expect(schedule.plant_id).toBe(10);
    });

    it('should create a daily schedule with custom minute', async () => {
      mockQuery.mockResolvedValue({ rows: [{ schedule_id: 1, plant_id: 10, cron_expression: '30 8 * * *', is_active: true }] });

      const schedule = await PumpSchedule.createDailySchedule(10, 8, 30);

      expect(schedule.cron_expression).toBe('30 8 * * *');
    });
  });

  describe('createWeeklySchedule', () => {
    it('should create a weekly schedule', async () => {
      mockQuery.mockResolvedValue({ rows: [{ schedule_id: 1, plant_id: 10, cron_expression: '0 8 * * 1', is_active: true }] });

      const schedule = await PumpSchedule.createWeeklySchedule(10, 1, 8);

      expect(schedule.cron_expression).toBe('0 8 * * 1');
      expect(schedule.plant_id).toBe(10);
    });

    it('should create a weekly schedule with custom minute', async () => {
      mockQuery.mockResolvedValue({ rows: [{ schedule_id: 1, plant_id: 10, cron_expression: '45 14 * * 3', is_active: true }] });

      const schedule = await PumpSchedule.createWeeklySchedule(10, 3, 14, 45);

      expect(schedule.cron_expression).toBe('45 14 * * 3');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation of schedule', () => {
      const schedule = new PumpSchedule({
        schedule_id: 1,
        plant_id: 10,
        cron_expression: '0 8 * * *',
        is_active: true
      });

      const json = schedule.toJSON();

      expect(json).toEqual({
        schedule_id: 1,
        plant_id: 10,
        cron_expression: '0 8 * * *',
        is_active: true,
        description: 'Daily at 8:00 AM'
      });
    });
  });
});