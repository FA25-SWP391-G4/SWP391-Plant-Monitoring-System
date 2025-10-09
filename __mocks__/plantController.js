/**
 * Plant Controller Mock
 */

// Get all plants for a user
const getAllPlants = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Mock plant data
        const plants = [
            {
                id: 'plant123',
                name: 'Monstera',
                species: 'Monstera deliciosa',
                location: 'Living Room',
                dateAdded: '2023-03-15T08:00:00Z',
                wateringFrequency: 7,
                userId: userId
            },
            {
                id: 'plant456',
                name: 'Snake Plant',
                species: 'Sansevieria trifasciata',
                location: 'Bedroom',
                dateAdded: '2023-04-20T10:30:00Z',
                wateringFrequency: 14,
                userId: userId
            },
            {
                id: 'plant789',
                name: 'Peace Lily',
                species: 'Spathiphyllum',
                location: 'Office',
                dateAdded: '2023-05-05T14:15:00Z',
                wateringFrequency: 5,
                userId: userId
            }
        ];
        
        return res.json(plants);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plants', error: error.message });
    }
};

// Get a specific plant by ID
const getPlantById = async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.user.id;
        
        // Mock finding a plant by ID
        const plant = {
            id: plantId,
            name: 'Monstera',
            species: 'Monstera deliciosa',
            location: 'Living Room',
            dateAdded: '2023-03-15T08:00:00Z',
            wateringFrequency: 7,
            lastWatered: '2023-06-10T09:30:00Z',
            userId: userId
        };
        
        // Check if plant exists and belongs to user
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        
        if (plant.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this plant' });
        }
        
        return res.json(plant);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plant', error: error.message });
    }
};

// Create a new plant
const createPlant = async (req, res) => {
    try {
        const { name, species, location, wateringFrequency } = req.body;
        const userId = req.user.id;
        
        // Validate required fields
        if (!name || !species) {
            return res.status(400).json({ message: 'Name and species are required' });
        }
        
        // Mock creating a new plant
        const newPlant = {
            id: `plant${Date.now()}`,
            name,
            species,
            location: location || 'Not specified',
            dateAdded: new Date().toISOString(),
            wateringFrequency: wateringFrequency || 7,
            userId
        };
        
        return res.status(201).json(newPlant);
    } catch (error) {
        return res.status(500).json({ message: 'Error creating plant', error: error.message });
    }
};

// Update a plant
const updatePlant = async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.user.id;
        const updates = req.body;
        
        // Mock finding plant by ID
        const plant = {
            id: plantId,
            name: 'Monstera',
            species: 'Monstera deliciosa',
            location: 'Living Room',
            dateAdded: '2023-03-15T08:00:00Z',
            wateringFrequency: 7,
            userId
        };
        
        // Check if plant exists and belongs to user
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        
        if (plant.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this plant' });
        }
        
        // Mock updating the plant
        const updatedPlant = {
            ...plant,
            ...updates,
            id: plantId,  // Ensure ID doesn't change
            userId       // Ensure userId doesn't change
        };
        
        return res.json(updatedPlant);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating plant', error: error.message });
    }
};

// Delete a plant
const deletePlant = async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.user.id;
        
        // Mock finding plant by ID
        const plant = {
            id: plantId,
            name: 'Monstera',
            species: 'Monstera deliciosa',
            userId
        };
        
        // Check if plant exists and belongs to user
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        
        if (plant.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this plant' });
        }
        
        // Mock successful deletion
        return res.json({
            message: 'Plant successfully deleted',
            id: plantId
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting plant', error: error.message });
    }
};

// Get plant health status
const getPlantHealthStatus = async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.user.id;
        
        // Mock finding plant by ID
        const plant = {
            id: plantId,
            name: 'Monstera',
            species: 'Monstera deliciosa',
            userId
        };
        
        // Check if plant exists and belongs to user
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        
        if (plant.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this plant' });
        }
        
        // Mock health status data
        const healthStatus = {
            plantId,
            status: 'Healthy',
            lastUpdated: new Date().toISOString(),
            metrics: {
                moisture: 68,
                temperature: 24.5,
                light: 82,
                humidity: 65
            },
            recommendations: [
                'Optimal conditions detected',
                'Next watering recommended in 3 days'
            ]
        };
        
        return res.json(healthStatus);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plant health status', error: error.message });
    }
};

// Get plant history data
const getPlantHistory = async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.user.id;
        
        // Mock finding plant by ID
        const plant = {
            id: plantId,
            name: 'Monstera',
            species: 'Monstera deliciosa',
            userId
        };
        
        // Check if plant exists and belongs to user
        if (!plant) {
            return res.status(404).json({ message: 'Plant not found' });
        }
        
        if (plant.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized access to this plant' });
        }
        
        // Mock historical data - 7 days
        const today = new Date();
        const history = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            history.push({
                date: date.toISOString(),
                moisture: 60 + Math.floor(Math.random() * 20),
                temperature: 22 + Math.random() * 5,
                light: 70 + Math.floor(Math.random() * 25),
                humidity: 60 + Math.floor(Math.random() * 15)
            });
        }
        
        return res.json(history);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching plant history', error: error.message });
    }
};

module.exports = {
    getAllPlants,
    getPlantById,
    createPlant,
    updatePlant,
    deletePlant,
    getPlantHealthStatus,
    getPlantHistory
};