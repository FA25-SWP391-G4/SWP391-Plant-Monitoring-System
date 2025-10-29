'use client'

import React from 'react';
import { Pie, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PieChart = ({ data, nameKey, valueKey, height = 300 }) => {
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart;