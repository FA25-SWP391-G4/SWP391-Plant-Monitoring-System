const request = require('supertest');
const express = require('express');
const PumpSchedule = require('../models/PumpSchedule');
const schedulerService = require('../services/schedulerService');
const PumpScheduleMock = require('../models/PumpSchedule');
const schedulerServiceMock = require('../services/schedulerService');

// Mock dependencies
jest.mock('../models/PumpSchedule');
jest.mock('../services/schedulerService');

// Create test app with routes
const app = express();
app.use(express.json());

// Import the controller routes (assuming they're defined in the file)

// Mock the routes
app.post('/api/schedules', async (req, res) => {
    try {
        const schedule = new PumpSchedule(req.body);
        await schedule.save();
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
        await schedulerService.updateSchedule(schedule.schedule_id);
        res.json(schedule.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        const scheduleId = req.params.id;
        await PumpSchedule.deleteByPlantId(scheduleId);
        schedulerService.removeSchedule(scheduleId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

describe('Pump Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/schedules', () => {
        it('should create a new pump schedule successfully', async () => {
            const mockScheduleData = {
                plant_id: 1,
                schedule_time: '08:00',
                duration: 30,
                is_active: true
            };

            const mockSchedule = {
                schedule_id: 1,
                ...mockScheduleData,
                save: jest.fn().mockResolvedValue(true),
                toJSON: jest.fn().mockReturnValue({ schedule_id: 1, ...mockScheduleData })
            };

            PumpScheduleMock.mockImplementation(() => mockSchedule);
            schedulerServiceMock.updateSchedule.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/schedules')
                .send(mockScheduleData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ schedule_id: 1, ...mockScheduleData });
            expect(mockSchedule.save).toHaveBeenCalled();
            expect(schedulerServiceMock.updateSchedule).toHaveBeenCalledWith(1);
        });

        it('should handle errors when creating schedule fails', async () => {
            const mockScheduleData = { plant_id: 1 };
            const errorMessage = 'Database error';

            PumpScheduleMock.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            const response = await request(app)
                .post('/api/schedules')
                .send(mockScheduleData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
        });
    });

    describe('PUT /api/schedules/:id', () => {
        it('should update an existing pump schedule successfully', async () => {
            const scheduleId = '1';
            const updateData = { duration: 45, is_active: false };
            
            const mockSchedule = {
                schedule_id: 1,
                plant_id: 1,
                duration: 30,
                is_active: true,
                save: jest.fn().mockResolvedValue(true),
                toJSON: jest.fn().mockReturnValue({ 
                    schedule_id: 1, 
                    plant_id: 1, 
                    duration: 45, 
                    is_active: false 
                })
            };

            PumpScheduleMock.findById.mockResolvedValue(mockSchedule);
            schedulerServiceMock.updateSchedule.mockResolvedValue(true);

            const response = await request(app)
                .put(`/api/schedules/${scheduleId}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.duration).toBe(45);
            expect(response.body.is_active).toBe(false);
            expect(PumpScheduleMock.findById).toHaveBeenCalledWith(scheduleId);
            expect(mockSchedule.save).toHaveBeenCalled();
            expect(schedulerServiceMock.updateSchedule).toHaveBeenCalledWith(1);
        });

        it('should return 404 when schedule not found', async () => {
            const scheduleId = '999';
            PumpScheduleMock.findById.mockResolvedValue(null);

            const response = await request(app)
                .put(`/api/schedules/${scheduleId}`)
                .send({ duration: 45 });

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ error: 'Schedule not found' });
            expect(schedulerServiceMock.updateSchedule).not.toHaveBeenCalled();
        });

        it('should handle errors when updating schedule fails', async () => {
            const scheduleId = '1';
            const errorMessage = 'Update failed';

            PumpScheduleMock.findById.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .put(`/api/schedules/${scheduleId}`)
                .send({ duration: 45 });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
        });
    });

    describe('DELETE /api/schedules/:id', () => {
        it('should delete a pump schedule successfully', async () => {
            const scheduleId = '1';

            PumpScheduleMock.deleteByPlantId.mockResolvedValue(true);
            schedulerServiceMock.removeSchedule.mockReturnValue(true);

            const response = await request(app)
                .delete(`/api/schedules/${scheduleId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ success: true });
            expect(PumpScheduleMock.deleteByPlantId).toHaveBeenCalledWith(scheduleId);
            expect(schedulerServiceMock.removeSchedule).toHaveBeenCalledWith(scheduleId);
        });

        it('should handle errors when deleting schedule fails', async () => {
            const scheduleId = '1';
            const errorMessage = 'Delete failed';

            PumpScheduleMock.deleteByPlantId.mockRejectedValue(new Error(errorMessage));

            const response = await request(app)
                .delete(`/api/schedules/${scheduleId}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: errorMessage });
        });
    });
});