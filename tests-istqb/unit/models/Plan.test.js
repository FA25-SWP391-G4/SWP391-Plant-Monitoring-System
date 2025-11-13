const Plan = require('../../../models/Plan');
const { pool } = require('../../../config/db');

jest.mock('../../../config/db');

describe('Plan Model - Unit Tests', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = jest.fn();
    pool.query = mockQuery;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should create plan instance with all properties', () => {
      const planData = {
        id: 1,
        name: 'Premium',
        description: 'Premium plan',
        price_monthly: '99000',
        price_yearly: '990000',
        price_lifetime: '2990000',
        features: ['feature1', 'feature2'],
        max_plants: 50,
        is_admin_only: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const plan = new Plan(planData);

      expect(plan.id).toBe(1);
      expect(plan.name).toBe('Premium');
      expect(plan.priceMonthly).toBe(99000);
      expect(plan.priceYearly).toBe(990000);
      expect(plan.priceLifetime).toBe(2990000);
      expect(plan.features).toEqual(['feature1', 'feature2']);
      expect(plan.maxPlants).toBe(50);
      expect(plan.isAdminOnly).toBe(false);
      expect(plan.isActive).toBe(true);
    });

    it('should handle null price_lifetime', () => {
      const planData = {
        id: 1,
        name: 'Basic',
        price_monthly: '0',
        price_yearly: '0',
        price_lifetime: null
      };

      const plan = new Plan(planData);

      expect(plan.priceLifetime).toBeNull();
    });

    it('should default features to empty array', () => {
      const planData = { id: 1, name: 'Basic' };
      const plan = new Plan(planData);

      expect(plan.features).toEqual([]);
    });

    it('should default isActive to true when not false', () => {
      const planData = { id: 1, name: 'Basic' };
      const plan = new Plan(planData);

      expect(plan.isActive).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should retrieve all plans ordered by id', async () => {
      const mockRows = [
        { id: 1, name: 'Basic', price_monthly: '0', is_active: true },
        { id: 2, name: 'Premium', price_monthly: '99000', is_active: true }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const plans = await Plan.findAll();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM plans'));
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id ASC'));
      expect(plans).toHaveLength(2);
      expect(plans[0]).toBeInstanceOf(Plan);
      expect(plans[0].name).toBe('Basic');
    });

    it('should return empty array when no plans exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const plans = await Plan.findAll();

      expect(plans).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(Plan.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should retrieve plan by id', async () => {
      const mockRow = { id: 1, name: 'Premium', price_monthly: '99000' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const plan = await Plan.findById(1);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(plan).toBeInstanceOf(Plan);
      expect(plan.id).toBe(1);
    });

    it('should return null when plan not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const plan = await Plan.findById(999);

      expect(plan).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(Plan.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getPublicPlans', () => {
    it('should retrieve only active non-admin plans', async () => {
      const mockRows = [
        { id: 1, name: 'Basic', is_active: true, is_admin_only: false },
        { id: 2, name: 'Premium', is_active: true, is_admin_only: false }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const plans = await Plan.getPublicPlans();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('is_active = true AND is_admin_only = false'));
      expect(plans).toHaveLength(2);
      expect(plans[0].isAdminOnly).toBe(false);
    });

    it('should return empty array when no public plans', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const plans = await Plan.getPublicPlans();

      expect(plans).toEqual([]);
    });
  });

  describe('getAdminPlans', () => {
    it('should retrieve only active admin plans', async () => {
      const mockRows = [
        { id: 4, name: 'Admin', is_active: true, is_admin_only: true }
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const plans = await Plan.getAdminPlans();

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('is_active = true AND is_admin_only = true'));
      expect(plans).toHaveLength(1);
      expect(plans[0].isAdminOnly).toBe(true);
    });
  });

  describe('getPlanByName', () => {
    it('should retrieve plan by exact name match', async () => {
      const mockRow = { id: 2, name: 'Premium', is_active: true };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const plan = await Plan.getPlanByName('Premium');

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['Premium']);
      expect(plan).toBeInstanceOf(Plan);
      expect(plan.name).toBe('Premium');
    });

    it('should return null when plan not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const plan = await Plan.getPlanByName('NonExistent');

      expect(plan).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new plan with all fields', async () => {
      const planData = {
        name: 'Enterprise',
        description: 'Enterprise plan',
        priceMonthly: 299000,
        priceYearly: 2990000,
        priceLifetime: 9990000,
        features: ['unlimited', 'priority'],
        maxPlants: null,
        isAdminOnly: false,
        isActive: true
      };
      const mockRow = { id: 5, ...planData, features: JSON.stringify(planData.features) };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const plan = await Plan.create(planData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO plans'),
        expect.arrayContaining([
          'Enterprise',
          'Enterprise plan',
          299000,
          2990000,
          9990000,
          JSON.stringify(['unlimited', 'priority']),
          null,
          false,
          true
        ])
      );
      expect(plan).toBeInstanceOf(Plan);
      expect(plan.name).toBe('Enterprise');
    });

    it('should create plan with default values', async () => {
      const planData = { name: 'Basic', description: 'Basic plan' };
      const mockRow = { id: 1, ...planData, price_monthly: 0, features: '[]' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const plan = await Plan.create(planData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0, 0, null, '[]', null, false, true])
      );
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Duplicate plan name'));

      await expect(Plan.create({ name: 'Premium' })).rejects.toThrow('Duplicate plan name');
    });
  });

  describe('update', () => {
    it('should update plan fields dynamically', async () => {
      const planData = { id: 1, name: 'Premium', price_monthly: '99000' };
      const plan = new Plan(planData);
      
      const updateData = { priceMonthly: 149000, description: 'Updated description' };
      const mockUpdated = { ...planData, price_monthly: '149000', description: 'Updated description' };
      mockQuery.mockResolvedValue({ rows: [mockUpdated] });

      const updated = await plan.update(updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE plans'),
        expect.arrayContaining([149000, 'Updated description', 1])
      );
      expect(updated.priceMonthly).toBe(149000);
    });

    it('should return same instance when no updates provided', async () => {
      const planData = { id: 1, name: 'Premium' };
      const plan = new Plan(planData);

      const result = await plan.update({});

      expect(mockQuery).not.toHaveBeenCalled();
      expect(result).toBe(plan);
    });

    it('should update features as JSON string', async () => {
      const plan = new Plan({ id: 1, name: 'Premium' });
      const newFeatures = ['feature1', 'feature2', 'feature3'];
      mockQuery.mockResolvedValue({ rows: [{ id: 1, features: newFeatures }] });

      await plan.update({ features: newFeatures });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([JSON.stringify(newFeatures)])
      );
    });
  });

  describe('delete', () => {
    it('should soft delete plan by setting is_active to false', async () => {
      const plan = new Plan({ id: 1, name: 'Premium', is_active: true });
      const mockUpdated = { id: 1, is_active: false, updated_at: new Date() };
      mockQuery.mockResolvedValue({ rows: [mockUpdated] });

      const result = await plan.delete();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE plans'),
        [1]
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw error on database failure', async () => {
      const plan = new Plan({ id: 1, name: 'Premium' });
      mockQuery.mockRejectedValue(new Error('Delete failed'));

      await expect(plan.delete()).rejects.toThrow('Delete failed');
    });
  });

  describe('canAccess', () => {
    it('should allow access to active non-admin plan', () => {
      const plan = new Plan({ id: 1, is_active: true, is_admin_only: false });

      expect(plan.canAccess('User')).toBe(true);
      expect(plan.canAccess('Admin')).toBe(true);
    });

    it('should deny access to inactive plan', () => {
      const plan = new Plan({ id: 1, is_active: false, is_admin_only: false });

      expect(plan.canAccess('User')).toBe(false);
    });

    it('should deny non-admin access to admin-only plan', () => {
      const plan = new Plan({ id: 1, is_active: true, is_admin_only: true });

      expect(plan.canAccess('User')).toBe(false);
    });

    it('should allow admin access to admin-only plan', () => {
      const plan = new Plan({ id: 1, is_active: true, is_admin_only: true });

      expect(plan.canAccess('Admin')).toBe(true);
    });
  });

  describe('getPriceForType', () => {
    it('should return monthly price', () => {
      const plan = new Plan({ id: 1, price_monthly: '99000' });

      expect(plan.getPriceForType('monthly')).toBe(99000);
    });

    it('should return yearly price', () => {
      const plan = new Plan({ id: 1, price_yearly: '990000' });

      expect(plan.getPriceForType('yearly')).toBe(990000);
    });

    it('should return lifetime price', () => {
      const plan = new Plan({ id: 1, price_lifetime: '2990000' });

      expect(plan.getPriceForType('lifetime')).toBe(2990000);
    });

    it('should return null for invalid subscription type', () => {
      const plan = new Plan({ id: 1, price_monthly: '99000' });

      expect(plan.getPriceForType('invalid')).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should return clean JSON representation', () => {
      const planData = {
        id: 1,
        name: 'Premium',
        description: 'Premium plan',
        price_monthly: '99000',
        price_yearly: '990000',
        price_lifetime: '2990000',
        features: ['feature1'],
        max_plants: 50,
        is_admin_only: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      const plan = new Plan(planData);

      const json = plan.toJSON();

      expect(json).toHaveProperty('id', 1);
      expect(json).toHaveProperty('name', 'Premium');
      expect(json).toHaveProperty('priceMonthly', 99000);
      expect(json).toHaveProperty('features');
      expect(json).toHaveProperty('isActive', true);
    });
  });

  describe('Validation Methods', () => {
    describe('validateName', () => {
      it('should validate correct plan name', () => {
        expect(Plan.validateName('Premium')).toBe(true);
      });

      it('should throw error for empty name', () => {
        expect(() => Plan.validateName('')).toThrow('Plan name must be between 1 and 100 characters');
      });

      it('should throw error for null name', () => {
        expect(() => Plan.validateName(null)).toThrow('Plan name must be between 1 and 100 characters');
      });

      it('should throw error for non-string name', () => {
        expect(() => Plan.validateName(123)).toThrow('Plan name must be between 1 and 100 characters');
      });

      it('should throw error for name exceeding 100 characters', () => {
        const longName = 'a'.repeat(101);
        expect(() => Plan.validateName(longName)).toThrow('Plan name must be between 1 and 100 characters');
      });
    });

    describe('validatePrice', () => {
      it('should validate positive number', () => {
        expect(Plan.validatePrice(99000)).toBe(true);
      });

      it('should validate zero', () => {
        expect(Plan.validatePrice(0)).toBe(true);
      });

      it('should validate null price', () => {
        expect(Plan.validatePrice(null)).toBe(true);
      });

      it('should throw error for negative price', () => {
        expect(() => Plan.validatePrice(-100)).toThrow('Price must be a non-negative number or null');
      });

      it('should throw error for non-number price', () => {
        expect(() => Plan.validatePrice('99000')).toThrow('Price must be a non-negative number or null');
      });
    });

    describe('validateFeatures', () => {
      it('should validate array of features', () => {
        expect(Plan.validateFeatures(['feature1', 'feature2'])).toBe(true);
      });

      it('should validate empty array', () => {
        expect(Plan.validateFeatures([])).toBe(true);
      });

      it('should validate null/undefined features', () => {
        expect(Plan.validateFeatures(null)).toBe(true);
        expect(Plan.validateFeatures(undefined)).toBe(true);
      });

      it('should throw error for non-array features', () => {
        expect(() => Plan.validateFeatures('feature1')).toThrow('Features must be an array');
        expect(() => Plan.validateFeatures({ feature: 'value' })).toThrow('Features must be an array');
      });
    });
  });
});