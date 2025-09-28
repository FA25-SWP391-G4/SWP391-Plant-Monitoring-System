import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';
import './AIDashboard.css';

const AIDashboard = () => {
    const [aiStatus, setAiStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [wateringPrediction, setWateringPrediction] = useState(null);
    const [healthAnalysis, setHealthAnalysis] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatResponse, setChatResponse] = useState(null);
    const [scheduleOptimization, setScheduleOptimization] = useState(null);
    const [bulkAnalysis, setBulkAnalysis] = useState(null);

    useEffect(() => {
        loadAIStatus();
    }, []);

    const loadAIStatus = async () => {
        try {
            const status = await aiService.getStatus();
            setAiStatus(status);
            if (status.plantsWithData.length > 0) {
                setSelectedPlant(status.plantsWithData[0].id);
            }
        } catch (error) {
            console.error('Failed to load AI status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWateringPrediction = async () => {
        if (!selectedPlant) return;
        try {
            setLoading(true);
            const prediction = await aiService.predictWatering(selectedPlant);
            setWateringPrediction(prediction);
        } catch (error) {
            alert('Failed to get watering prediction: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleHealthAnalysis = async () => {
        if (!selectedPlant) return;
        try {
            setLoading(true);
            const analysis = await aiService.analyzeHealth(selectedPlant);
            setHealthAnalysis(analysis);
        } catch (error) {
            alert('Failed to analyze plant health: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        try {
            setLoading(true);
            const response = await aiService.chat(chatMessage, selectedPlant);
            setChatResponse(response);
            setChatMessage('');
        } catch (error) {
            alert('Failed to get AI advice: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleOptimization = async () => {
        if (!selectedPlant) return;
        try {
            setLoading(true);
            const optimization = await aiService.optimizeSchedule(selectedPlant);
            setScheduleOptimization(optimization);
        } catch (error) {
            alert('Failed to optimize schedule: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAnalysis = async () => {
        try {
            setLoading(true);
            const analysis = await aiService.bulkHealthAnalysis();
            setBulkAnalysis(analysis);
        } catch (error) {
            alert('Failed to perform bulk analysis: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !aiStatus) {
        return <div className="ai-loading">Loading AI features...</div>;
    }

    if (!aiStatus?.isPremium) {
        return (
            <div className="ai-premium-required">
                <div className="premium-banner">
                    <h2>🚀 Premium AI Features</h2>
                    <p>Unlock advanced AI-powered plant care with premium subscription:</p>
                    <ul>
                        <li>🤖 AI Watering Predictions</li>
                        <li>🏥 Plant Health Analysis</li>
                        <li>💬 AI Plant Care Chatbot</li>
                        <li>📅 Smart Schedule Optimization</li>
                        <li>📊 Bulk Health Reports</li>
                    </ul>
                    <button className="upgrade-btn">Upgrade to Premium</button>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-dashboard">
            <h1>🌱 AI Plant Care Assistant</h1>

            {/* Plant Selector */}
            <div className="plant-selector">
                <label>Select Plant:</label>
                <select
                    value={selectedPlant || ''}
                    onChange={(e) => setSelectedPlant(e.target.value)}
                >
                    {aiStatus.plantsWithData.map(plant => (
                        <option key={plant.id} value={plant.id}>
                            {plant.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="ai-features-grid">
                {/* Watering Prediction */}
                <div className="ai-feature-card">
                    <h3>💧 Watering Prediction</h3>
                    <p>Predict when your plant needs watering</p>
                    <button
                        onClick={handleWateringPrediction}
                        disabled={loading || !selectedPlant}
                        className="ai-btn predict-btn"
                    >
                        {loading ? 'Analyzing...' : 'Get Prediction'}
                    </button>

                    {wateringPrediction && (
                        <div className="prediction-result">
                            <div className={`prediction-status ${wateringPrediction.prediction}`}>
                                {wateringPrediction.prediction === 'needs_watering' ? '🚨' : '✅'}
                            </div>
                            <p>{aiService.formatPredictionMessage(wateringPrediction)}</p>
                            <small>Confidence: {(wateringPrediction.confidence * 100).toFixed(0)}%</small>
                        </div>
                    )}
                </div>

                {/* Health Analysis */}
                <div className="ai-feature-card">
                    <h3>🏥 Health Analysis</h3>
                    <p>AI-powered plant health assessment</p>
                    <button
                        onClick={handleHealthAnalysis}
                        disabled={loading || !selectedPlant}
                        className="ai-btn health-btn"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Health'}
                    </button>

                    {healthAnalysis && (
                        <div className="health-result">
                            <div
                                className="health-score"
                                style={{
                                    backgroundColor: aiService.getHealthStatusColor(healthAnalysis.status),
                                    color: 'white'
                                }}
                            >
                                {aiService.getHealthStatusIcon(healthAnalysis.status)}
                                {healthAnalysis.healthScore}/100
                            </div>
                            <p className="health-status">{healthAnalysis.status.toUpperCase()}</p>

                            {healthAnalysis.issues.length > 0 && (
                                <div className="health-issues">
                                    <h4>Issues Found:</h4>
                                    <ul>
                                        {healthAnalysis.issues.map((issue, index) => (
                                            <li key={index}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="health-recommendations">
                                <h4>Recommendations:</h4>
                                <ul>
                                    {healthAnalysis.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Chatbot */}
                <div className="ai-feature-card chat-card">
                    <h3>💬 AI Plant Care Assistant</h3>
                    <p>Get personalized plant care advice</p>

                    <form onSubmit={handleChatSubmit} className="chat-form">
                        <textarea
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Ask me anything about plant care..."
                            rows="3"
                        />
                        <button
                            type="submit"
                            disabled={loading || !chatMessage.trim()}
                            className="ai-btn chat-btn"
                        >
                            {loading ? 'Thinking...' : 'Ask AI'}
                        </button>
                    </form>

                    {chatResponse && (
                        <div className="chat-response">
                            <div className="ai-avatar">🤖</div>
                            <div className="ai-message">
                                <p>{chatResponse.advice}</p>
                                {chatResponse.plant && (
                                    <small>Context: {chatResponse.plant.name}</small>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Schedule Optimization */}
                <div className="ai-feature-card">
                    <h3>📅 Schedule Optimization</h3>
                    <p>Optimize watering schedules with AI</p>
                    <button
                        onClick={handleScheduleOptimization}
                        disabled={loading || !selectedPlant}
                        className="ai-btn optimize-btn"
                    >
                        {loading ? 'Optimizing...' : 'Optimize Schedule'}
                    </button>

                    {scheduleOptimization && (
                        <div className="optimization-result">
                            {scheduleOptimization.optimized ? (
                                <div className="optimized-schedule">
                                    <h4>✅ Optimization Complete</h4>
                                    <p><strong>Recommended Threshold:</strong> {scheduleOptimization.optimalThreshold}%</p>
                                    <p><strong>Frequency:</strong> Every {scheduleOptimization.optimalFrequency} days</p>
                                    <p><strong>Expected Savings:</strong> {scheduleOptimization.expectedSavings}</p>
                                    <small>Reasoning: {scheduleOptimization.reasoning}</small>
                                </div>
                            ) : (
                                <div className="optimization-failed">
                                    <p>{scheduleOptimization.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bulk Analysis */}
                <div className="ai-feature-card bulk-card">
                    <h3>📊 Bulk Health Analysis</h3>
                    <p>Analyze all your plants at once</p>
                    <button
                        onClick={handleBulkAnalysis}
                        disabled={loading}
                        className="ai-btn bulk-btn"
                    >
                        {loading ? 'Analyzing...' : 'Analyze All Plants'}
                    </button>

                    {bulkAnalysis && (
                        <div className="bulk-result">
                            <h4>Analysis Results ({bulkAnalysis.totalPlants} plants)</h4>
                            <div className="bulk-summary">
                                {bulkAnalysis.results.map((result, index) => (
                                    <div key={index} className="plant-summary">
                                        <h5>{result.plant.name}</h5>
                                        {result.health ? (
                                            <div className="plant-health">
                                                <span
                                                    className="health-badge"
                                                    style={{
                                                        backgroundColor: aiService.getHealthStatusColor(result.health.status)
                                                    }}
                                                >
                                                    {result.health.healthScore}/100
                                                </span>
                                                <span>{result.health.status}</span>
                                            </div>
                                        ) : (
                                            <span className="error">Analysis failed</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIDashboard;