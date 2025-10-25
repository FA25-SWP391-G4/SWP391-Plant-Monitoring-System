import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', color = 'primary', overlay = false, text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large'
  };

  const colorClasses = {
    primary: 'loading-spinner--primary',
    secondary: 'loading-spinner--secondary',
    white: 'loading-spinner--white'
  };

  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
        <div className="loading-leaf loading-leaf-1">🌱</div>
        <div className="loading-leaf loading-leaf-2">🌿</div>
        <div className="loading-leaf loading-leaf-3">🍃</div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
};

// Page transition loading component
export const PageTransitionLoader = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="page-transition-loader">
      <div className="transition-progress-bar"></div>
      <div className="transition-content">
        <div className="plant-logo">
          <div className="logo-leaf">🌱</div>
        </div>
        <div className="transition-dots">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
        </div>
      </div>
    </div>
  );
};

// Button loading state
export const ButtonLoading = ({ size = 'small' }) => (
  <div className={`button-loading ${size}`}>
    <div className="button-spinner"></div>
  </div>
);

// Card loading skeleton
export const CardSkeleton = ({ lines = 3, showImage = false }) => (
  <div className="card-skeleton">
    {showImage && <div className="skeleton-image"></div>}
    <div className="skeleton-content">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`skeleton-line ${index === lines - 1 ? 'skeleton-line--short' : ''}`}></div>
      ))}
    </div>
  </div>
);

// Data loading component for tables/lists
export const DataLoading = ({ rows = 5, columns = 4 }) => (
  <div className="data-loading">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="data-row">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="data-cell"></div>
        ))}
      </div>
    ))}
  </div>
);

export default Loading;
