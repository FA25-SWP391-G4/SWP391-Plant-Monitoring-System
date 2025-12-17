'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, change, changeType, icon: Icon, description, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    indigo: 'text-indigo-600 bg-indigo-50'
  };

  const getTrendIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (changeType === 'decrease') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (changeType === 'increase') return 'text-green-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined && change !== null) && (
          <div className="flex items-center space-x-1 mt-1">
            {getTrendIcon()}
            <span className={`text-sm ${getTrendColor()}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}