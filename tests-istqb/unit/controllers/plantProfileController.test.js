const PlantProfile = require('../models/PlantProfile');
const SystemLog = require('../models/SystemLog');
const { pool } = require('../config/db');

const {
    getAllPlantProfiles,
    getPlantProfileById,
    getPlantProfileBySpecies,
    createPlantProfile,
    updatePlantProfile,
    deletePlantProfile,
    getSpeciesSuggestions,
    getPlantProfileStats
} = require('./plantProfileController');

// Mock dependencies
jest.mock('../models/PlantProfile');
jest.mock('../models/SystemLog');
jest.mock('../config/db');
jest.mock('../utils/uuidGenerator');


describe('PlantProfileController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            params: {},
            body: {},
            user: { email: 'admin@test.com', role: 'Admin' }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        // Reset all mocks
        jest.clearAllMocks();
        
        // Mock SystemLog methods
        SystemLog.info = jest.fn();
        SystemLog.error = jest.fn();
    });

    describe('getAllPlantProfiles', () => {
        it('should return plant profiles with default pagination', async () => {
            const mockProfiles = [
                { profile_id: 1, species_name: 'Rose', description: 'Beautiful flower', ideal_moisture: 60 },
                { profile_id: 2, species_name: 'Tulip', description: 'Spring flower', ideal_moisture: 50 }
            ];

            pool.query = jest.fn()
                .mockResolvedValueOnce({ rows: mockProfiles })
                .mockResolvedValueOnce({ rows: [{ total: '2' }] });

            await getAllPlantProfiles(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockProfiles,
                pagination: {
                    current_page: 1,
                    total_pages: 1,
                    total_items: 2,
                    items_per_page: 20,
                    has_next: false,
                    has_prev: false
                },
                filters: {
                    search: '',
                    moisture_min: undefined,
                    moisture_max: undefined,
                    sort: 'species_name',
                    order: 'ASC'
                }
            });
        });

        it('should handle search and filter parameters', async () => {
            req.query = {
                search: 'rose',
                moisture_min: '40',
                moisture_max: '80',
                page: '2',
                limit: '10',
                sort: 'ideal_moisture',
                order: 'DESC'
            };

            pool.query = jest.fn()
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ total: '0' }] });

            await getAllPlantProfiles(req, res);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(species_name) LIKE LOWER($1)'),
                expect.arrayContaining(['%rose%', '%rose%', 40, 80, 10, 10])
            );
        });

        it('should handle database errors', async () => {
            pool.query = jest.fn().mockRejectedValue(new Error('Database error'));

            await getAllPlantProfiles(req, res);

            expect(SystemLog.error).toHaveBeenCalledWith(
                'PlantProfileController',
                'getAllPlantProfiles',
                'Database error'
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve plant profiles'
            });
        });
    });

    describe('getPlantProfileById', () => {
        it('should return a plant profile by ID', async () => {
            const mockProfile = {
                profile_id: 1,
                species_name: 'Rose',
                toJSON: jest.fn().mockReturnValue({ profile_id: 1, species_name: 'Rose' })
            };

            req.params.id = '1';
            PlantProfile.findById = jest.fn().mockResolvedValue(mockProfile);

            await getPlantProfileById(req, res);

            expect(PlantProfile.findById).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { profile_id: 1, species_name: 'Rose' }
            });
        });

        it('should return 400 for invalid ID format', async () => {
            req.params.id = 'invalid';

            await getPlantProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid profile ID format'
            });
        });

        it('should return 404 when profile not found', async () => {
            req.params.id = '999';
            PlantProfile.findById = jest.fn().mockResolvedValue(null);

            await getPlantProfileById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Plant profile not found'
            });
        });
    });

    describe('getPlantProfileBySpecies', () => {
        it('should return a plant profile by species name', async () => {
            const mockProfile = {
                species_name: 'Rose',
                toJSON: jest.fn().mockReturnValue({ species_name: 'Rose' })
            };

            req.params.name = 'Rose';
            PlantProfile.findBySpeciesName = jest.fn().mockResolvedValue(mockProfile);

            await getPlantProfileBySpecies(req, res);

            expect(PlantProfile.findBySpeciesName).toHaveBeenCalledWith('Rose');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { species_name: 'Rose' }
            });
        });

        it('should return 400 for empty species name', async () => {
            req.params.name = '';

            await getPlantProfileBySpecies(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Species name is required'
            });
        });
    });

    describe('createPlantProfile', () => {
        it('should create a new plant profile for admin user', async () => {
            const mockProfile = {
                species_name: 'Rose',
                save: jest.fn().mockResolvedValue({
                    species_name: 'Rose',
                    toJSON: jest.fn().mockReturnValue({ species_name: 'Rose' })
                })
            };

            req.body = {
                species_name: 'Rose',
                description: 'Beautiful flower',
                ideal_moisture: 60
            };

            PlantProfile.findBySpeciesName = jest.fn().mockResolvedValue(null);
            PlantProfile.mockImplementation(() => mockProfile);

            await createPlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Plant profile created successfully',
                data: { species_name: 'Rose' }
            });
        });

        it('should return 403 for non-admin user', async () => {
            req.user.role = 'User';

            await createPlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        });

        it('should return 400 for missing species name', async () => {
            req.body = { description: 'Test' };

            await createPlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Species name is required'
            });
        });

        it('should return 400 for invalid moisture range', async () => {
            req.body = {
                species_name: 'Rose',
                ideal_moisture: 150
            };

            await createPlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Ideal moisture must be between 0 and 100 percent'
            });
        });

        it('should return 409 for duplicate species name', async () => {
            req.body = { species_name: 'Rose' };
            PlantProfile.findBySpeciesName = jest.fn().mockResolvedValue({ species_name: 'Rose' });

            await createPlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'A plant profile with this species name already exists'
            });
        });
    });

    describe('updatePlantProfile', () => {
        it('should update an existing plant profile for admin user', async () => {
            const mockProfile = {
                profile_id: 1,
                species_name: 'Rose',
                save: jest.fn().mockResolvedValue({
                    toJSON: jest.fn().mockReturnValue({ species_name: 'Updated Rose' })
                })
            };

            req.params.id = '1';
            req.body = { species_name: 'Updated Rose' };

            PlantProfile.findById = jest.fn().mockResolvedValue(mockProfile);
            PlantProfile.findBySpeciesName = jest.fn().mockResolvedValue(null);

            await updatePlantProfile(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Plant profile updated successfully',
                data: { species_name: 'Updated Rose' }
            });
        });

        it('should return 403 for non-admin user', async () => {
            req.user.role = 'User';

            await updatePlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('should return 404 when profile not found', async () => {
            req.params.id = '999';
            PlantProfile.findById = jest.fn().mockResolvedValue(null);

            await updatePlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deletePlantProfile', () => {
        it('should delete a plant profile for admin user', async () => {
            const mockProfile = {
                profile_id: 1,
                species_name: 'Rose',
                delete: jest.fn().mockResolvedValue()
            };

            req.params.id = '1';
            PlantProfile.findById = jest.fn().mockResolvedValue(mockProfile);
            pool.query = jest.fn().mockResolvedValue({ rows: [{ count: '0' }] });

            await deletePlantProfile(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Plant profile deleted successfully'
            });
        });

        it('should return 409 when profile is in use', async () => {
            const mockProfile = { species_name: 'Rose' };
            req.params.id = '1';
            
            PlantProfile.findById = jest.fn().mockResolvedValue(mockProfile);
            pool.query = jest.fn().mockResolvedValue({ rows: [{ count: '5' }] });

            await deletePlantProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Cannot delete plant profile: it is currently being used by existing plants'
            });
        });
    });

    describe('getSpeciesSuggestions', () => {
        it('should return suggestions for valid search query', async () => {
            const mockSuggestions = [
                { profile_id: 1, species_name: 'Rose', description: 'Flower', ideal_moisture: 60 }
            ];

            req.query = { q: 'ros', limit: '5' };
            pool.query = jest.fn().mockResolvedValue({ rows: mockSuggestions });

            await getSpeciesSuggestions(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSuggestions
            });
        });

        it('should return empty array for short search query', async () => {
            req.query = { q: 'r' };

            await getSpeciesSuggestions(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: []
            });
        });
    });

    describe('getPlantProfileStats', () => {
        it('should return plant profile statistics', async () => {
            const mockStats = {
                total_profiles: '10',
                profiles_with_moisture: '8',
                avg_moisture: '55.5',
                min_moisture: '20',
                max_moisture: '90'
            };

            const mockDistribution = [
                { moisture_category: 'Low (26-50%)', count: '3' },
                { moisture_category: 'Medium (51-75%)', count: '5' }
            ];

            pool.query = jest.fn()
                .mockResolvedValueOnce({ rows: [mockStats] })
                .mockResolvedValueOnce({ rows: mockDistribution });

            await getPlantProfileStats(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    total_profiles: 10,
                    profiles_with_moisture: 8,
                    average_moisture: 55.5,
                    moisture_range: {
                        min: 20,
                        max: 90
                    },
                    distribution: [
                        { category: 'Low (26-50%)', count: 3 },
                        { category: 'Medium (51-75%)', count: 5 }
                    ]
                }
            });
        });

        it('should handle database errors in stats', async () => {
            pool.query = jest.fn().mockRejectedValue(new Error('Stats error'));

            await getPlantProfileStats(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to get plant profile statistics'
            });
        });
    });
});