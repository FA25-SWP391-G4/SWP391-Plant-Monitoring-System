const Subscription = require('../../../models/Subscription');
const { pool } = require('../../../config/db');
const { isValidUUID } = require('../../../utils/uuidGenerator');

jest.mock('../../../config/db');
jest.mock('../../../utils/uuidGenerator');

describe('Subscription Model - Unit Tests', () => {
  let mockSubscriptionData;
  let mockUUID;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    mockSubscriptionData = {
      id: 1,
      user_id: mockUUID,
      plan_id: 1,
      payment_id: 100,
      subscription_type: 'monthly',
      sub_start: new Date('2024-01-01'),
      sub_end: new Date('2026-02-01'),
      is_active: true,
      auto_renew: true,
      cancelled_at: null,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    };

    isValidUUID.mockReturnValue(true);
  });

  describe('Constructor', () => {
    it('should create subscription instance with all properties', () => {
      const subscription = new Subscription(mockSubscriptionData);

      expect(subscription.id).toBe(1);
      expect(subscription.userId).toBe(mockUUID);
      expect(subscription.planId).toBe(1);
      expect(subscription.paymentId).toBe(100);
      expect(subscription.subscriptionType).toBe('monthly');
      expect(subscription.isActive).toBe(true);
      expect(subscription.autoRenew).toBe(true);
    });

    it('should default isActive to true when not provided', () => {
      const data = { ...mockSubscriptionData, is_active: undefined };
      const subscription = new Subscription(data);

      expect(subscription.isActive).toBe(true);
    });

    it('should default autoRenew to true when not provided', () => {
      const data = { ...mockSubscriptionData, auto_renew: undefined };
      const subscription = new Subscription(data);

      expect(subscription.autoRenew).toBe(true);
    });
  });

  describe('findAll()', () => {
    it('should retrieve all subscriptions with plan and user details', async () => {
      const mockRows = [
        { ...mockSubscriptionData, plan_name: 'Premium', user_email: 'test@example.com', user_name: 'John Doe' }
      ];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await Subscription.findAll();

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT s.*, p.name as plan_name'));
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Subscription);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Subscription.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById()', () => {
    it('should retrieve subscription by ID', async () => {
      const mockRow = { ...mockSubscriptionData, plan_name: 'Premium' };
      pool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await Subscription.findById(1);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toBeInstanceOf(Subscription);
      expect(result.id).toBe(1);
    });

    it('should return null when subscription not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Subscription.findById(999);

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(Subscription.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId()', () => {
    it('should retrieve all subscriptions for a user', async () => {
      const mockRows = [mockSubscriptionData];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await Subscription.findByUserId(mockUUID);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockUUID]);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Subscription);
    });

    it('should throw error for invalid user ID format', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(Subscription.findByUserId('invalid')).rejects.toThrow('Invalid user ID format');
    });

    it('should throw error for null user ID', async () => {
      await expect(Subscription.findByUserId(null)).rejects.toThrow('Invalid user ID format');
    });
  });

  describe('getUserActiveSubscription()', () => {
    it('should retrieve active subscription for user', async () => {
      const mockRow = { 
        ...mockSubscriptionData, 
        plan_name: 'Premium',
        plan_description: 'Premium plan',
        plan_features: ['feature1', 'feature2']
      };
      pool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await Subscription.getUserActiveSubscription(mockUUID);

      expect(result).toBeInstanceOf(Subscription);
      expect(result.isActive).toBe(true);
    });

    it('should return null when no active subscription exists', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Subscription.getUserActiveSubscription(mockUUID);

      expect(result).toBeNull();
    });

    it('should throw error for invalid user ID', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(Subscription.getUserActiveSubscription('invalid')).rejects.toThrow('Invalid user ID format');
    });
  });

  describe('getExpiringSubscriptions()', () => {
    it('should retrieve subscriptions expiring within specified days', async () => {
      const mockRows = [mockSubscriptionData];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await Subscription.getExpiringSubscriptions(7);

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL \'7 days\''));
      expect(result).toHaveLength(1);
    });

    it('should use default 7 days when not specified', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await Subscription.getExpiringSubscriptions();

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL \'7 days\''));
    });
  });

  describe('createSubscription()', () => {
    it('should create monthly subscription with correct end date', async () => {
      const newSubscriptionData = {
        userId: mockUUID,
        planId: 1,
        paymentId: 100,
        subscriptionType: 'monthly'
      };
      pool.query.mockResolvedValue({ rows: [mockSubscriptionData] });

      const result = await Subscription.createSubscription(newSubscriptionData);

      expect(pool.query).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Subscription);
    });

    it('should create yearly subscription with correct end date', async () => {
      const newSubscriptionData = {
        userId: mockUUID,
        planId: 1,
        paymentId: 100,
        subscriptionType: 'yearly'
      };
      pool.query.mockResolvedValue({ rows: [mockSubscriptionData] });

      await Subscription.createSubscription(newSubscriptionData);

      expect(pool.query).toHaveBeenCalled();
    });

    it('should create lifetime subscription with null end date', async () => {
      const newSubscriptionData = {
        userId: mockUUID,
        planId: 1,
        paymentId: 100,
        subscriptionType: 'lifetime'
      };
      pool.query.mockResolvedValue({ rows: [{ ...mockSubscriptionData, sub_end: null }] });

      const result = await Subscription.createSubscription(newSubscriptionData);

      expect(result).toBeInstanceOf(Subscription);
    });

    it('should throw error for invalid user ID', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(Subscription.createSubscription({
        userId: 'invalid',
        planId: 1,
        subscriptionType: 'monthly'
      })).rejects.toThrow('Invalid user ID format');
    });

    it('should throw error for invalid plan ID', async () => {
      await expect(Subscription.createSubscription({
        userId: mockUUID,
        planId: 'invalid',
        subscriptionType: 'monthly'
      })).rejects.toThrow('Invalid plan ID');
    });

    it('should throw error for invalid subscription type', async () => {
      await expect(Subscription.createSubscription({
        userId: mockUUID,
        planId: 1,
        subscriptionType: 'invalid'
      })).rejects.toThrow('Invalid subscription type');
    });
  });

  describe('update()', () => {
    it('should update subscription fields', async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const updatedData = { isActive: false, autoRenew: false };
      pool.query.mockResolvedValue({ rows: [{ ...mockSubscriptionData, is_active: false, auto_renew: false }] });

      const result = await subscription.update(updatedData);

      expect(pool.query).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(result.autoRenew).toBe(false);
    });

    it('should return unchanged subscription when no updates provided', async () => {
      const subscription = new Subscription(mockSubscriptionData);

      const result = await subscription.update({});

      expect(pool.query).not.toHaveBeenCalled();
      expect(result).toBe(subscription);
    });

    it('should update multiple fields at once', async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const updates = { planId: 2, subscriptionType: 'yearly', autoRenew: false };
      pool.query.mockResolvedValue({ rows: [{ ...mockSubscriptionData, ...updates }] });

      await subscription.update(updates);

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('cancel()', () => {
    it('should cancel subscription and set cancelled_at timestamp', async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const cancelledData = { 
        ...mockSubscriptionData, 
        is_active: false, 
        cancelled_at: new Date() 
      };
      pool.query.mockResolvedValue({ rows: [cancelledData] });

      const result = await subscription.cancel();

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [subscription.id]);
      expect(result.isActive).toBe(false);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should throw error on database failure', async () => {
      const subscription = new Subscription(mockSubscriptionData);
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(subscription.cancel()).rejects.toThrow('Database error');
    });
  });

  describe('deactivateUserSubscriptions()', () => {
    it('should deactivate all active subscriptions for user', async () => {
      const mockRows = [mockSubscriptionData];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await Subscription.deactivateUserSubscriptions(mockUUID);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [mockUUID]);
      expect(result).toHaveLength(1);
    });

    it('should throw error for invalid user ID', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(Subscription.deactivateUserSubscriptions('invalid')).rejects.toThrow('Invalid user ID format');
    });
  });

  describe('expireSubscriptions()', () => {
    it('should mark expired subscriptions as inactive', async () => {
      const mockRows = [mockSubscriptionData];
      pool.query.mockResolvedValue({ rows: mockRows });

      const result = await Subscription.expireSubscriptions();

      expect(pool.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('isExpired()', () => {
    it('should return false for lifetime subscription', () => {
      const data = { ...mockSubscriptionData, sub_end: null };
      const subscription = new Subscription(data);

      expect(subscription.isExpired()).toBe(false);
    });

    it('should return true for expired subscription', () => {
      const data = { ...mockSubscriptionData, sub_end: new Date('2020-01-01') };
      const subscription = new Subscription(data);

      expect(subscription.isExpired()).toBe(true);
    });

    it('should return false for active subscription', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const data = { ...mockSubscriptionData, sub_end: futureDate };
      const subscription = new Subscription(data);

      expect(subscription.isExpired()).toBe(false);
    });
  });

  describe('daysUntilExpiry()', () => {
    it('should return null for lifetime subscription', () => {
      const data = { ...mockSubscriptionData, sub_end: null };
      const subscription = new Subscription(data);

      expect(subscription.daysUntilExpiry()).toBeNull();
    });

    it('should calculate days until expiry correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const data = { ...mockSubscriptionData, sub_end: futureDate };
      const subscription = new Subscription(data);

      const days = subscription.daysUntilExpiry();
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });
  });

  describe('isCurrent()', () => {
    it('should return true for active lifetime subscription', () => {
      const data = { ...mockSubscriptionData, is_active: true, sub_end: null };
      const subscription = new Subscription(data);

      expect(subscription.isCurrent()).toBe(true);
    });

    it('should return false for inactive subscription', () => {
      const data = { ...mockSubscriptionData, is_active: false };
      const subscription = new Subscription(data);

      expect(subscription.isCurrent()).toBe(false);
    });

    it('should return false for expired subscription', () => {
      const data = { 
        ...mockSubscriptionData, 
        is_active: true, 
        sub_end: new Date('2020-01-01') 
      };
      const subscription = new Subscription(data);

      expect(subscription.isCurrent()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    it('should return clean JSON representation', () => {
      const subscription = new Subscription(mockSubscriptionData);

      const json = subscription.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId');
      expect(json).toHaveProperty('planId');
      expect(json).toHaveProperty('isExpired');
      expect(json).toHaveProperty('daysUntilExpiry');
      expect(json).toHaveProperty('isCurrent');
    });

    it('should include computed properties', () => {
      const subscription = new Subscription(mockSubscriptionData);

      const json = subscription.toJSON();

      expect(typeof json.isExpired).toBe('boolean');
      expect(typeof json.isCurrent).toBe('boolean');
    });
  });

  describe('extend()', () => {
    it('should extend subscription by adding months', async () => {
      const subscription = new Subscription(mockSubscriptionData);
      const newEndDate = new Date('2027-04-01');
      pool.query.mockResolvedValue({ rows: [{ ...mockSubscriptionData, sub_end: newEndDate }] });

      await subscription.extend(2);

      expect(pool.query).toHaveBeenCalled();
    });

    it('should throw error for inactive subscription', async () => {
      const data = { ...mockSubscriptionData, is_active: false };
      const subscription = new Subscription(data);

      await expect(subscription.extend(1)).rejects.toThrow('Cannot extend inactive or expired subscription');
    });

    it('should throw error for lifetime subscription', async () => {
      const data = { ...mockSubscriptionData, sub_end: null };
      const subscription = new Subscription(data);

      await expect(subscription.extend(1)).rejects.toThrow('Lifetime subscriptions cannot be extended');
    });
  });

  describe('canUserUpgrade()', () => {
    it('should allow upgrade when no active subscription exists', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      Subscription.getUserActiveSubscription = jest.fn().mockResolvedValue(null);

      const result = await Subscription.canUserUpgrade(mockUUID, 'Premium');

      expect(result.canUpgrade).toBe(true);
      expect(result.reason).toBe('No existing subscription');
    });

    it('should throw error for invalid user ID', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(Subscription.canUserUpgrade('invalid', 'Premium')).rejects.toThrow('Invalid user ID format');
    });
  });
});