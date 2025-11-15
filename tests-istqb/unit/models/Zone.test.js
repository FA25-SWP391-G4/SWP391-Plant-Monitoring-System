const Zone = require('../../../models/Zone');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

    jest.mock('../../../config/db');
    jest.mock('../../../utils/uuidGenerator');

    describe('Zone', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      describe('create()', () => {
        test('should create a new zone', async () => {
          const mockZoneData = {
            user_id: 'valid-uuid',
            zone_name: 'Living Room',
            description: 'Indoor plants'
          };

          isValidUUID.mockReturnValue(true);
          pool.query.mockResolvedValue({
            rows: [{
              zone_id: 1,
              user_id: 'valid-uuid',
              zone_name: 'Living Room',
              description: 'Indoor plants',
              created_at: new Date()
            }]
          });

          const result = await Zone.create(mockZoneData);

          expect(result).toBeInstanceOf(Zone);
          expect(result.zone_name).toBe('Living Room');
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO zones'),
            expect.arrayContaining(['valid-uuid', 'Living Room', 'Indoor plants', expect.any(Date)])
          );
        });

        test('should validate required fields', async () => {
          await expect(Zone.create({})).rejects.toThrow('User ID and zone name are required');
          await expect(Zone.create({ user_id: 'test' })).rejects.toThrow('User ID and zone name are required');
        });

        test('should validate user_id UUID', async () => {
          isValidUUID.mockReturnValue(false);
          
          await expect(Zone.create({
            user_id: 'invalid-uuid',
            zone_name: 'Test Zone'
          })).rejects.toThrow('Invalid user_id UUID');
        });
      });

      describe('findByUserId()', () => {
        test('should retrieve user zones with plant count', async () => {
          isValidUUID.mockReturnValue(true);
          pool.query.mockResolvedValue({
            rows: [
              { zone_id: 1, zone_name: 'Garden', plant_count: '3', user_id: '123e4567-e89b-12d3-a456-426614174000', description: null, created_at: new Date() },
              { zone_id: 2, zone_name: 'Kitchen', plant_count: '1', user_id: '123e4567-e89b-12d3-a456-426614174000', description: null, created_at: new Date() }
            ]
          });

          const result = await Zone.findByUserId('123e4567-e89b-12d3-a456-426614174000');

          expect(result).toHaveLength(2);
          expect(result[0]).toBeInstanceOf(Zone);
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('COUNT(p.plant_id) as plant_count'),
            ['123e4567-e89b-12d3-a456-426614174000']
          );
        });

        test('should order by created_at DESC', async () => {
          isValidUUID.mockReturnValue(true);
          pool.query.mockResolvedValue({ rows: [] });

          await Zone.findByUserId('123e4567-e89b-12d3-a456-426614174000');

          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY z.created_at DESC'),
            expect.any(Array)
          );
        });
      });

      describe('findById()', () => {
        test('should find zone by ID', async () => {
          pool.query.mockResolvedValue({
            rows: [{ zone_id: 1, zone_name: 'Test Zone', plant_count: '2', user_id: '123e4567-e89b-12d3-a456-426614174000', description: null, created_at: new Date() }]
          });

          const result = await Zone.findById(1);

          expect(result).toBeInstanceOf(Zone);
          expect(result.zone_id).toBe(1);
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('WHERE z.zone_id = $1'),
            [1]
          );
        });

        test('should return null for non-existent zone', async () => {
          pool.query.mockResolvedValue({ rows: [] });

          const result = await Zone.findById(999);

          expect(result).toBeNull();
        });
      });

      describe('update()', () => {
        test('should update zone name and description', async () => {
          pool.query.mockResolvedValue({
            rows: [{ zone_id: 1, zone_name: 'Updated Zone', description: 'New description' }]
          });

          const result = await Zone.update(1, { zone_name: 'Updated Zone', description: 'New description' });

          expect(result).toBeInstanceOf(Zone);
          expect(result.zone_name).toBe('Updated Zone');
          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE zones'),
            [1, 'Updated Zone', 'New description']
          );
        });

        test('should trim whitespace from inputs', async () => {
          pool.query.mockResolvedValue({
            rows: [{ zone_id: 1, zone_name: 'Trimmed', description: 'Trimmed desc' }]
          });

          await Zone.update(1, { zone_name: '  Trimmed  ', description: '  Trimmed desc  ' });

          expect(pool.query).toHaveBeenCalledWith(
            expect.any(String),
            [1, 'Trimmed', 'Trimmed desc']
          );
        });
      });

      describe('delete()', () => {
        test('should delete zone and unassign plants', async () => {
          pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ zone_id: 1 }] });

          const result = await Zone.delete(1, '123e4567-e89b-12d3-a456-426614174000');

          expect(result).toBe(true);
          expect(pool.query).toHaveBeenCalledTimes(2);
          expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE plants'), [1]);
          expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM zones'), [1, '123e4567-e89b-12d3-a456-426614174000']);
        });

        test('should verify user ownership', async () => {
          pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });

          const result = await Zone.delete(1, 'wrong-user');

          expect(result).toBe(false);
        });
      });

      describe('assignPlant()', () => {
        test('should assign plant to zone', async () => {
          pool.query.mockResolvedValue({ rows: [{ plant_id: 1, zone_id: 1 }] });

          const result = await Zone.assignPlant(1, 1);

          expect(result).toBe(true);
        });

        test('should update plant zone_id', async () => {
          pool.query.mockResolvedValue({ rows: [{ plant_id: 1, zone_id: 2 }] });

          await Zone.assignPlant(2, 1);

          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE plants'),
            [2, 1]
          );
        });
      });

      describe('getPlantsInZone()', () => {
        test('should retrieve all plants in zone', async () => {
          pool.query.mockResolvedValue({
            rows: [
              { plant_id: 1, zone_id: 1, species_name: 'Rose' },
              { plant_id: 2, zone_id: 1, species_name: 'Tulip' }
            ]
          });

          const result = await Zone.getPlantsInZone(1);

          expect(result).toHaveLength(2);
          expect(result[0].species_name).toBe('Rose');
        });

        test('should include species name from profile', async () => {
          pool.query.mockResolvedValue({
            rows: [{ plant_id: 1, species_name: 'Orchid' }]
          });

          await Zone.getPlantsInZone(1);

          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('LEFT JOIN plant_profiles pp ON p.profile_id = pp.profile_id'),
            [1]
          );
        });

        test('should order by created_at DESC', async () => {
          pool.query.mockResolvedValue({ rows: [] });

          await Zone.getPlantsInZone(1);

          expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY p.created_at DESC'),
            [1]
          );
        });
      });

      describe('toJSON()', () => {
        test('should return properly formatted JSON', () => {
          const zone = new Zone({
            zone_id: 1,
            zone_name: 'Garden',
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            description: 'Outdoor plants',
            created_at: new Date()
          });

          const json = zone.toJSON();

          expect(json).toHaveProperty('zone_id');
          expect(json).toHaveProperty('zone_name');
          expect(json).toHaveProperty('user_id');
          expect(json).toHaveProperty('description');
          expect(json).toHaveProperty('created_at');
        });

        test('should include plant_count', () => {
          const zone = new Zone({ zone_id: 1, zone_name: 'Test', plant_count: 5 });

          const json = zone.toJSON();

          expect(json.plant_count).toBe(5);
        });
      });
    });