'use client';

import React from 'react';

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10'
};

export function Loader({ size = 'md', className = '' }) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em] ${sizeClass} ${className}`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}