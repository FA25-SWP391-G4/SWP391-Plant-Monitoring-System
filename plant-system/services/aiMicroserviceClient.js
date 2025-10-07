const fetch = require('node-fetch');

class AIMicroserviceClient {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
    }

    async sendChatMessage(message, context = []) {
        try {
            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, context }),
            });

            if (!response.ok) {
                throw new Error(`AI Microservice error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending chat message to AI microservice:', error);
            throw error;
        }
    }

    async analyzePlantHealth(sensorData, plantType) {
        try {
            const response = await fetch(`${this.baseUrl}/analyze-plant-health`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sensor_data: sensorData, plant_type: plantType }),
            });

            if (!response.ok) {
                throw new Error(`AI Microservice error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error analyzing plant health with AI microservice:', error);
            throw error;
        }
    }

    async predictWatering(sensorData, plantType, lastWatering) {
        try {
            const response = await fetch(`${this.baseUrl}/predict-watering`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    sensor_data: sensorData, 
                    plant_type: plantType,
                    last_watering: lastWatering
                }),
            });

            if (!response.ok) {
                throw new Error(`AI Microservice error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error predicting watering with AI microservice:', error);
            throw error;
        }
    }

    async optimizeSchedule(plants) {
        try {
            const response = await fetch(`${this.baseUrl}/optimize-schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plants }),
            });

            if (!response.ok) {
                throw new Error(`AI Microservice error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error optimizing schedule with AI microservice:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            
            if (!response.ok) {
                throw new Error(`AI Microservice health check failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('AI Microservice health check failed:', error);
            throw error;
        }
    }
}

module.exports = new AIMicroserviceClient();