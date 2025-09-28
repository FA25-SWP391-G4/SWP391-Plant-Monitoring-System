/**
 * ============================================================================
 * FRONTEND AI SERVICE - CLIENT-SIDE AI FEATURES INTEGRATION
 * ============================================================================
 *
 * Frontend service for interacting with AI-powered backend features:
 * - Watering predictions
 * - Plant health analysis
 * - AI chatbot
 * - Schedule optimization
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class AIService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/api/ai`;
    }

    /**
     * Get AI features status for current user
     */
    async getStatus() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get AI status');
            }

            return data.data;
        } catch (error) {
            console.error('Error getting AI status:', error);
            throw error;
        }
    }

    /**
     * Predict watering needs for a plant
     */
    async predictWatering(plantId, daysAhead = 7) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/predict-watering/${plantId}?daysAhead=${daysAhead}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to predict watering needs');
            }

            return data.data;
        } catch (error) {
            console.error('Error predicting watering:', error);
            throw error;
        }
    }

    /**
     * Analyze plant health
     */
    async analyzeHealth(plantId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/analyze-health/${plantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to analyze plant health');
            }

            return data.data;
        } catch (error) {
            console.error('Error analyzing health:', error);
            throw error;
        }
    }

    /**
     * Perform bulk health analysis for all user plants
     */
    async bulkHealthAnalysis() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/bulk-health`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to perform bulk health analysis');
            }

            return data.data;
        } catch (error) {
            console.error('Error in bulk health analysis:', error);
            throw error;
        }
    }

    /**
     * Chat with AI assistant
     */
    async chat(message, plantId = null) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    plantId: plantId ? parseInt(plantId) : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get AI advice');
            }

            return data.data;
        } catch (error) {
            console.error('Error chatting with AI:', error);
            throw error;
        }
    }

    /**
     * Optimize watering schedule
     */
    async optimizeSchedule(plantId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.baseURL}/optimize-schedule/${plantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to optimize schedule');
            }

            return data.data;
        } catch (error) {
            console.error('Error optimizing schedule:', error);
            throw error;
        }
    }

    /**
     * UTILITY METHODS
     */

    /**
     * Get health status color for UI
     */
    getHealthStatusColor(status) {
        const colors = {
            excellent: '#10B981', // green
            good: '#3B82F6',      // blue
            fair: '#F59E0B',      // yellow
            poor: '#EF4444',      // red
            critical: '#7F1D1D'   // dark red
        };
        return colors[status] || colors.fair;
    }

    /**
     * Get health status icon
     */
    getHealthStatusIcon(status) {
        const icons = {
            excellent: '🌱',
            good: '✅',
            fair: '⚠️',
            poor: '❌',
            critical: '🚨'
        };
        return icons[status] || icons.fair;
    }

    /**
     * Format prediction message for display
     */
    formatPredictionMessage(prediction) {
        if (prediction.prediction === 'insufficient_data') {
            return 'Need more sensor data for accurate predictions';
        }

        if (prediction.prediction === 'needs_watering') {
            const date = new Date(prediction.nextWatering).toLocaleDateString();
            return `Water needed by ${date} (${prediction.daysUntilWatering} days)`;
        }

        return `Sufficient water for next ${prediction.daysUntilWatering} days`;
    }

    /**
     * Check if user has premium access
     */
    async checkPremiumAccess() {
        try {
            const status = await this.getStatus();
            return status.isPremium;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export default new AIService();