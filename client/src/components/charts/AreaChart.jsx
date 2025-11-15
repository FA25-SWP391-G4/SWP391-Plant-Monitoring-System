'use client'

import React from 'react';
import { Area, ResponsiveContainer, AreaChart as RechartsAreaChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AreaChart = ({ data, xKey, yKey, height = 300, color = '#3b82f6' }) => {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

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
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={xKey} 
          tickFormatter={formatXAxis} 
          stroke="#9ca3af" 
        />
        <YAxis stroke="#9ca3af" />
        <Tooltip />
        <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.3} />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChart;