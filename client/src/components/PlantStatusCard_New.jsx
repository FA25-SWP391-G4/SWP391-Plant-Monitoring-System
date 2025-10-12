import React from 'react';
import { FiDroplet, FiSun, FiHeart, FiCalendar } from 'react-icons/fi';
import './PlantStatusCard.css';

export default function PlantStatusCard({ plant }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'var(--success)';
      case 'good': return 'var(--info)';
      case 'warning': return 'var(--warning)';
      case 'critical': return 'var(--error)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent': return '🌟';
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div className="plant-status-card">
      <div className="plant-header">
        <div className="plant-avatar">
          <div className="plant-emoji">🌱</div>
        </div>
        <div className="plant-info">
          <h4 className="plant-name">{plant.name}</h4>
          <div className="plant-status">
            <span 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(plant.status) }}
            ></span>
            <span className="status-text" style={{ color: getStatusColor(plant.status) }}>
              {plant.status}
            </span>
          </div>
        </div>
        <div className="status-icon">
          {getStatusIcon(plant.status)}
        </div>
      </div>

      <div className="plant-metrics">
        <div className="metric">
          <div className="metric-icon">
            <FiDroplet />
          </div>
          <div className="metric-content">
            <span className="metric-label">Moisture</span>
            <div className="metric-value-container">
              <span className="metric-value">{plant.moisture}%</span>
              <div className="metric-bar">
                <div 
                  className="metric-fill"
                  style={{ 
                    width: `${plant.moisture}%`,
                    backgroundColor: getStatusColor(plant.status)
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="metric">
          <div className="metric-icon">
            <FiSun />
          </div>
          <div className="metric-content">
            <span className="metric-label">Light</span>
            <span className="metric-value">{plant.light}</span>
          </div>
        </div>

        <div className="metric">
          <div className="metric-icon">
            <FiHeart />
          </div>
          <div className="metric-content">
            <span className="metric-label">Health</span>
            <span className="metric-value">{plant.health}</span>
          </div>
        </div>
      </div>

      <div className="plant-footer">
        <div className="last-watered">
          <FiCalendar className="calendar-icon" />
          <span>Last watered {plant.lastWatered}</span>
        </div>
        <button className="water-btn">
          <FiDroplet />
          Water Now
        </button>
      </div>
    </div>
  );
}