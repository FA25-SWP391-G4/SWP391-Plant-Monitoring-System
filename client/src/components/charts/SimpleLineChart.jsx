import React from 'react';

/**
 * Simple line chart component for sensor data visualization
 * Uses SVG for rendering without external dependencies
 */
export const SimpleLineChart = ({ data, metrics, width = 800, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data to display
      </div>
    );
  }

  const margin = { top: 20, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Get min/max values for scaling
  const getMinMax = (metric) => {
    const values = data.map(d => d[metric]).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { min: 0, max: 100 };
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };

  // Color mapping for different metrics
  const colors = {
    moisture: '#3b82f6',
    temperature: '#ef4444',
    humidity: '#10b981',
    light: '#f59e0b'
  };

  // Create scales
  const xScale = (index) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value, min, max) => {
    const range = max - min;
    if (range === 0) return chartHeight / 2;
    return chartHeight - ((value - min) / range) * chartHeight;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="border border-gray-200 dark:border-gray-700 rounded">
        {/* Background */}
        <rect width={width} height={height} fill="transparent" />
        
        {/* Grid lines */}
        <g>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={margin.left}
              y1={margin.top + ratio * chartHeight}
              x2={margin.left + chartWidth}
              y2={margin.top + ratio * chartHeight}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2,2"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={margin.left + ratio * chartWidth}
              y1={margin.top}
              x2={margin.left + ratio * chartWidth}
              y2={margin.top + chartHeight}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="2,2"
            />
          ))}
        </g>

        {/* Chart lines */}
        {metrics.map(metric => {
          const { min, max } = getMinMax(metric);
          const points = data
            .map((d, i) => {
              const value = d[metric];
              if (value === null || value === undefined) return null;
              return {
                x: margin.left + xScale(i),
                y: margin.top + yScale(value, min, max)
              };
            })
            .filter(Boolean);

          if (points.length === 0) return null;

          const pathData = points
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
            .join(' ');

          return (
            <g key={metric}>
              {/* Line */}
              <path
                d={pathData}
                fill="none"
                stroke={colors[metric]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill={colors[metric]}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke="currentColor"
          strokeOpacity="0.5"
        />

        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke="currentColor"
          strokeOpacity="0.5"
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 6) !== 0) return null;
          return (
            <text
              key={i}
              x={margin.left + xScale(i)}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill="currentColor"
              opacity="0.7"
            >
              {d.timestamp}
            </text>
          );
        })}

        {/* Legend */}
        {metrics.map((metric, i) => (
          <g key={metric}>
            <rect
              x={margin.left + i * 120}
              y={height - 30}
              width="12"
              height="2"
              fill={colors[metric]}
            />
            <text
              x={margin.left + i * 120 + 20}
              y={height - 25}
              fontSize="12"
              fill="currentColor"
              opacity="0.8"
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};