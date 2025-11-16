'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LineChart({ title, description, data, options = {}, height = 300 }) {
  const hasData = Boolean(
    data?.datasets?.some((dataset) => Array.isArray(dataset?.data) && dataset.data.length)
  );

  const styledData = hasData
    ? {
        ...data,
        datasets: data.datasets.map((dataset) => ({
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          ...dataset,
        })),
      }
    : data;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: (styledData?.datasets?.length || 0) > 1,
        position: 'top',
        labels: {
          color: '#475569',
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#475569',
        bodyColor: '#475569',
        borderColor: 'rgba(203, 213, 225, 1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(203, 213, 225, 0.3)',
          lineWidth: 1,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(203, 213, 225, 0.5)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...(options.plugins || {}),
      legend: {
        ...defaultOptions.plugins.legend,
        ...(options.plugins?.legend || {}),
      },
      tooltip: {
        ...defaultOptions.plugins.tooltip,
        ...(options.plugins?.tooltip || {}),
      },
      title: {
        ...defaultOptions.plugins.title,
        ...(options.plugins?.title || {}),
      },
    },
    scales: {
      ...defaultOptions.scales,
      ...(options.scales || {}),
      x: {
        ...defaultOptions.scales.x,
        ...(options.scales?.x || {}),
        grid: {
          ...defaultOptions.scales.x.grid,
          ...(options.scales?.x?.grid || {}),
        },
        ticks: {
          ...defaultOptions.scales.x.ticks,
          ...(options.scales?.x?.ticks || {}),
        },
      },
      y: {
        ...defaultOptions.scales.y,
        ...(options.scales?.y || {}),
        grid: {
          ...defaultOptions.scales.y.grid,
          ...(options.scales?.y?.grid || {}),
        },
        ticks: {
          ...defaultOptions.scales.y.ticks,
          ...(options.scales?.y?.ticks || {}),
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div style={{ height: `${height}px` }}>
            <Line data={styledData} options={mergedOptions} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No chart data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}