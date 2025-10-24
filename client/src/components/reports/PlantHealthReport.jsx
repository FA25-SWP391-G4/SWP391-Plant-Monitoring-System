'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PlantHealthReport({ plant }) {
  const { t } = useTranslation();
  const { isPremium } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  // Example data for the report - in a real app, this would come from API
  const mockHealthData = {
    currentScore: 87,
    scoreHistory: [82, 85, 83, 80, 84, 87, 89, 86, 87, 88, 85, 87],
    healthMetrics: {
      moisture: { value: 62, min: 50, max: 70, status: 'good' },
      temperature: { value: 24, min: 18, max: 26, status: 'good' },
      light: { value: 65, min: 60, max: 80, status: 'warning' },
      humidity: { value: 45, min: 40, max: 60, status: 'good' },
    },
    growthMetrics: {
      height: { current: 45, previous: 43, unit: 'cm' },
      leaves: { current: 12, previous: 10, unit: '' },
      stemDiameter: { current: 1.2, previous: 1.1, unit: 'cm' },
    },
    issues: [
      { type: 'warning', message: t('reports.lightLevels', 'Light levels slightly below optimal') },
    ],
    recommendations: [
      t('reports.moveToSunnier', 'Consider moving plant to a sunnier spot'),
      t('reports.reduceWatering', 'Slightly reduce watering frequency'),
      t('reports.addFertilizer', 'Add fertilizer within the next 7 days')
    ]
  };

  // Health score color based on value
  const getHealthColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Health metric status indicator
  const renderStatusIndicator = (status) => {
    switch (status) {
      case 'good':
        return <span className="flex items-center text-emerald-600"><CheckCircle size={16} className="mr-1" /> {t('reports.good', 'Good')}</span>;
      case 'warning':
        return <span className="flex items-center text-yellow-600"><AlertCircle size={16} className="mr-1" /> {t('reports.attention', 'Needs attention')}</span>;
      case 'critical':
        return <span className="flex items-center text-red-600"><AlertCircle size={16} className="mr-1" /> {t('reports.critical', 'Critical')}</span>;
      default:
        return null;
    }
  };

  // Growth trend indicator
  const renderGrowthTrend = (current, previous) => {
    const difference = current - previous;
    if (difference > 0) {
      return <span className="flex items-center text-emerald-600"><TrendingUp size={16} className="mr-1" /> +{difference.toFixed(1)}</span>;
    } else if (difference < 0) {
      return <span className="flex items-center text-red-600"><TrendingDown size={16} className="mr-1" /> {difference.toFixed(1)}</span>;
    }
    return <span className="text-gray-600">No change</span>;
  };

  // Health history chart
  const healthHistoryChart = {
    labels: Array(mockHealthData.scoreHistory.length).fill('').map((_, i) => i + 1),
    datasets: [
      {
        label: t('reports.healthScore', 'Health Score'),
        data: mockHealthData.scoreHistory,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // Options for charts
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 50,
        max: 100,
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  return (
    <div>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Current health status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.currentHealthStatus', 'Current Health Status')}
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-36 h-36">
                  {/* Health score gauge */}
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      stroke-width="3"
                      fill="none"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ stroke: 'currentColor' }}
                    />
                    <path
                      className={mockHealthData.currentScore >= 80 ? "text-emerald-500" : mockHealthData.currentScore >= 60 ? "text-yellow-500" : "text-red-500"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${mockHealthData.currentScore}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ stroke: 'currentColor' }}
                    />
                    <text x="18" y="21" className="text-3xl font-semibold" textAnchor="middle">
                      {mockHealthData.currentScore}
                    </text>
                  </svg>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className={`text-lg font-medium ${getHealthColor(mockHealthData.currentScore)}`}>
                  {mockHealthData.currentScore >= 80
                    ? t('reports.excellent', 'Excellent')
                    : mockHealthData.currentScore >= 60
                    ? t('reports.good', 'Good')
                    : t('reports.poor', 'Poor')}
                </p>
                <p className="text-sm text-gray-600">
                  {mockHealthData.currentScore >= 80
                    ? t('reports.healthyPlant', 'Your plant is thriving!')
                    : mockHealthData.currentScore >= 60
                    ? t('reports.minorIssues', 'Your plant has minor issues that need attention.')
                    : t('reports.criticalCondition', 'Your plant needs immediate care.')}
                </p>
              </div>
            </div>

            {/* Environment metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.environmentMetrics', 'Environment Metrics')}
              </h3>
              <div className="space-y-4">
                {Object.entries(mockHealthData.healthMetrics).map(([key, metric]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key}</span>
                      {renderStatusIndicator(metric.status)}
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      {/* Range marker for min/max */}
                      <div className="relative w-full h-full">
                        <div 
                          className="absolute h-full bg-gray-200"
                          style={{ 
                            left: `${metric.min}%`, 
                            right: `${100 - metric.max}%` 
                          }}
                        ></div>
                        <div 
                          className={`absolute h-full ${
                            metric.status === 'good' ? 'bg-emerald-500' :
                            metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: '4px',
                            left: `${metric.value}%`,
                            transform: 'translateX(-2px)'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>{t('reports.current', 'Current')}: {metric.value}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            {/* Growth metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.growthMetrics', 'Growth Metrics')}
              </h3>
              <div className="space-y-4">
                {Object.entries(mockHealthData.growthMetrics).map(([key, metric]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">
                      {key === 'height' ? t('reports.height', 'Height') :
                       key === 'leaves' ? t('reports.leaves', 'Leaves') :
                       t('reports.stemDiameter', 'Stem Diameter')}
                    </span>
                    <div className="flex items-center">
                      <span className="text-lg font-medium mr-2">
                        {metric.current} {metric.unit}
                      </span>
                      {renderGrowthTrend(metric.current, metric.previous)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health history chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.healthHistory', 'Health History')}
              </h3>
              <div className="h-48">
                <Line data={healthHistoryChart} options={chartOptions} />
              </div>
              <div className="text-xs text-center text-gray-500 mt-2">
                {timeRange === 'week' && t('reports.lastWeekDays', 'Last 7 days')}
                {timeRange === 'month' && t('reports.lastMonthDays', 'Last 30 days')}
                {timeRange === 'year' && t('reports.lastYearMonths', 'Last 12 months')}
              </div>
            </div>
          </div>
        </div>

        {/* Issues and recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Issues */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('reports.detectedIssues', 'Detected Issues')}
            </h3>
            {mockHealthData.issues.length > 0 ? (
              <ul className="space-y-2">
                {mockHealthData.issues.map((issue, index) => (
                  <li key={index} className={`flex items-start p-3 rounded-lg ${
                    issue.type === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}>
                    <AlertCircle size={20} className={
                      issue.type === 'critical' ? 'text-red-500 mr-2 shrink-0' : 'text-yellow-500 mr-2 shrink-0'
                    } />
                    <span className={
                      issue.type === 'critical' ? 'text-red-700' : 'text-yellow-700'
                    }>{issue.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-gray-600">
                  {t('reports.noIssues', 'No issues detected. Your plant is doing well!')}
                </p>
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('reports.careRecommendations', 'Care Recommendations')}
            </h3>
            <ul className="space-y-2">
              {mockHealthData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={20} className="text-emerald-500 mr-2 shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Premium feature promotion */}
      {!isPremium && (
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-4 md:mb-0 md:mr-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500 mx-auto md:mx-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                {t('reports.unlockAdvancedHealth', 'Unlock Advanced Plant Health Analysis')}
              </h3>
              <p className="text-amber-700 mb-4">
                {t('reports.premiumHealthDesc', 'Get access to detailed health trends, personalized care recommendations, disease detection, and much more with a premium subscription.')}
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-6">
              <Button
                onClick={() => router.push('/upgrade')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {t('common.upgradeToPremium', 'Upgrade to Premium')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}