'use client'

import React from 'react';
import { Line, ResponsiveContainer, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const LineChart = ({ data, xKey, yKey, labelKey, height = 300, showLegend = false, colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'] }) => {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Reorganize data for multiple lines if necessary
  const chartData = labelKey 
    ? data 
    : [{name: 'Value', data: data}];

  // Format dates on X axis if xKey is a date
  const isDateX = data[0] && data[0][xKey] && !isNaN(new Date(data[0][xKey]));
  const formatXAxis = (value) => {
    if (isDateX) {
      const date = new Date(value);
      return date.toLocaleDateString();
    }
    return value;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={xKey} 
          tickFormatter={formatXAxis} 
          stroke="#9ca3af"
        />
        <YAxis stroke="#9ca3af" />
        <Tooltip />
        {showLegend && <Legend />}
        
        {labelKey ? (
          // Multiple lines grouped by labelKey
          Array.from(new Set(data.map(item => item[labelKey]))).map((label, index) => (
            <Line
              key={label}
              type="monotone"
              dataKey={yKey}
              data={data.filter(item => item[labelKey] === label)}
              name={label}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))
        ) : (
          // Single line
          <Line 
            type="monotone" 
            dataKey={yKey} 
            stroke={colors[0]} 
            activeDot={{ r: 8 }} 
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;