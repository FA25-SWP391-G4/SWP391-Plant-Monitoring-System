const PlantProfile = require('../../../models/PlantProfile');
const { pool } = require('../../../config/db');

jest.mock('../../../config/db');

describe('PlantProfile Model - Constructor', () => {
  describe('Valid Constructor Calls', () => {
    it('should create a PlantProfile instance with all properties', () => {
      const profileData = {
        profile_id: 1,
        species_name: 'Monstera Deliciosa',
        description: 'Popular tropical houseplant',
        ideal_moisture: 65
      };

      const profile = new PlantProfile(profileData);

      expect(profile.profile_id).toBe(1);
      expect(profile.species_name).toBe('Monstera Deliciosa');
      expect(profile.description).toBe('Popular tropical houseplant');
      expect(profile.ideal_moisture).toBe(65);
    });

    it('should create a PlantProfile instance with minimal properties', () => {
      const profileData = {
        species_name: 'Cactus'
      };

      const profile = new PlantProfile(profileData);

      expect(profile.species_name).toBe('Cactus');
      expect(profile.profile_id).toBeUndefined();
      expect(profile.description).toBeUndefined();
      expect(profile.ideal_moisture).toBeUndefined();
    });

    it('should handle null values', () => {
      const profileData = {
        profile_id: null,
        species_name: null,
        description: null,
        ideal_moisture: null
      };

      const profile = new PlantProfile(profileData);

      expect(profile.profile_id).toBeNull();
      expect(profile.species_name).toBeNull();
      expect(profile.description).toBeNull();
      expect(profile.ideal_moisture).toBeNull();
    });

    it('should handle zero as ideal_moisture', () => {
      const profileData = {
        profile_id: 2,
        species_name: 'Succulent',
        description: 'Drought-resistant plant',
        ideal_moisture: 0
      };

      const profile = new PlantProfile(profileData);

      expect(profile.ideal_moisture).toBe(0);
    });

    it('should handle empty string values', () => {
      const profileData = {
        profile_id: 3,
        species_name: '',
        description: '',
        ideal_moisture: 50
      };

      const profile = new PlantProfile(profileData);

      expect(profile.species_name).toBe('');
      expect(profile.description).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long species_name', () => {
      const longName = 'A'.repeat(500);
      const profileData = {
        profile_id: 4,
        species_name: longName,
        description: 'Test',
        ideal_moisture: 60
      };

      const profile = new PlantProfile(profileData);

      expect(profile.species_name).toBe(longName);
      expect(profile.species_name.length).toBe(500);
    });

    it('should handle negative ideal_moisture', () => {
      const profileData = {
        profile_id: 5,
        species_name: 'Test Plant',
        description: 'Test',
        ideal_moisture: -10
      };

      const profile = new PlantProfile(profileData);

      expect(profile.ideal_moisture).toBe(-10);
    });

    it('should handle ideal_moisture greater than 100', () => {
      const profileData = {
        profile_id: 6,
        species_name: 'Aquatic Plant',
        description: 'Water-loving plant',
        ideal_moisture: 150
      };

      const profile = new PlantProfile(profileData);

      expect(profile.ideal_moisture).toBe(150);
    });

    it('should handle special characters in description', () => {
      const profileData = {
        profile_id: 7,
        species_name: 'Test Plant',
        description: 'Special chars: <>&"\'',
        ideal_moisture: 70
      };

      const profile = new PlantProfile(profileData);

      expect(profile.description).toBe('Special chars: <>&"\'');
    });

    it('should handle empty object', () => {
      const profileData = {};

      const profile = new PlantProfile(profileData);

      expect(profile.profile_id).toBeUndefined();
      expect(profile.species_name).toBeUndefined();
      expect(profile.description).toBeUndefined();
      expect(profile.ideal_moisture).toBeUndefined();
    });
  });

  describe('Data Type Validation', () => {
    it('should accept numeric profile_id as number', () => {
      const profileData = {
        profile_id: 123,
        species_name: 'Test',
        description: 'Test',
        ideal_moisture: 60
      };

      const profile = new PlantProfile(profileData);

      expect(typeof profile.profile_id).toBe('number');
      expect(profile.profile_id).toBe(123);
    });

    it('should accept profile_id as string', () => {
      const profileData = {
        profile_id: '456',
        species_name: 'Test',
        description: 'Test',
        ideal_moisture: 60
      };

      const profile = new PlantProfile(profileData);

      expect(typeof profile.profile_id).toBe('string');
      expect(profile.profile_id).toBe('456');
    });

    it('should handle ideal_moisture as string', () => {
      const profileData = {
        profile_id: 8,
        species_name: 'Test',
        description: 'Test',
        ideal_moisture: '75'
      };

      const profile = new PlantProfile(profileData);

      expect(profile.ideal_moisture).toBe('75');
    });

    it('should handle ideal_moisture as float', () => {
      const profileData = {
        profile_id: 9,
        species_name: 'Test',
        description: 'Test',
        ideal_moisture: 67.5
      };

      const profile = new PlantProfile(profileData);

      expect(profile.ideal_moisture).toBe(67.5);
    });
  });
});