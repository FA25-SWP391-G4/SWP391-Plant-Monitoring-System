import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

/**
 * DashboardWidget component
 * 
 * A specialized card component designed for dashboard widgets with:
 * - Consistent styling
 * - Optional icon
 * - Support for loading state
 * - Customizable action buttons
 */
export function DashboardWidget({ 
  title, 
  icon,
  description,
  children, 
  className = '',
  action,
  isLoading = false,
  footerContent,
  ...props 
}) {
  return (
    <Card className={`dashboard-widget overflow-hidden ${className}`} {...props}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-muted-foreground text-lg">{icon}</span>}
          <div>
            <CardTitle className="text-xl font-medium">{title}</CardTitle>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : children}
      </CardContent>
      {footerContent && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {footerContent}
        </div>
      )}
    </Card>
  );
}

DashboardWidget.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  action: PropTypes.node,
  isLoading: PropTypes.bool,
  footerContent: PropTypes.node
};

export default DashboardWidget;