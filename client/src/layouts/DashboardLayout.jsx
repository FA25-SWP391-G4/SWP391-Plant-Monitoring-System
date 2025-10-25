import React from 'react';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiDroplet, FiSun, FiWind } from 'react-icons/fi';

/**
 * DashboardLayout component
 * 
 * A specialized layout for dashboard pages featuring:
 * - Grid layout for widgets and metrics
 * - Optional sidebar for filters/settings
 * - Responsive design that works on mobile and desktop
 */
export function DashboardLayout({ 
  children,
  title = 'Dashboard', 
  subtitle,
  actions,
  showMetrics = true,
  className = '',
  ...props
}) {
  const metrics = [
    { 
      icon: <FiTrendingUp className="text-green-500" />, 
      value: '92%', 
      label: 'Growth Rate', 
      change: '+2.5%', 
      positive: true 
    },
    { 
      icon: <FiDroplet className="text-blue-500" />, 
      value: '68%', 
      label: 'Humidity', 
      change: '-1.2%', 
      positive: false 
    },
    { 
      icon: <FiSun className="text-amber-500" />, 
      value: '24°C', 
      label: 'Temperature', 
      change: '+0.8°', 
      positive: true 
    },
    { 
      icon: <FiWind className="text-slate-500" />, 
      value: '14 kph', 
      label: 'Wind Speed', 
      change: '-2.1%', 
      positive: true 
    },
  ];

  return (
    <div className={`dashboard-layout ${className}`} {...props}>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>

        {showMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label, change, positive }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100 flex items-center">
      <div className="rounded-full bg-gray-50 p-3 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold">{value}</h3>
          <span className={`text-sm font-medium ${positive ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  showMetrics: PropTypes.bool,
  className: PropTypes.string,
};

MetricCard.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  change: PropTypes.string,
  positive: PropTypes.bool,
};

export default DashboardLayout;