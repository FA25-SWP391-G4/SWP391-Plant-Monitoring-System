import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with various styles and variants
 * Inspired by the SWP391 design system
 */
export function Button({
  children,
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  // Define styles based on variants
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
    link: 'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0'
  };
  
  // Size styles
  const sizeClasses = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-10 px-6 text-lg',
    icon: 'h-9 w-9'
  };
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;
  
  // Handle the button as a custom component if asChild is true
  if (asChild) {
    // In a full implementation, this would use React.cloneElement
    // For simplicity, we'll just return children with the props
    return React.Children.map(children, child => {
      return React.cloneElement(child, {
        className: buttonClasses,
        disabled,
        onClick,
        ...props
      });
    });
  }
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  asChild: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default Button;