import React from 'react';
import PropTypes from 'prop-types';

/**
 * Input component
 * Inspired by the SWP391 design system
 */
export function Input({
  className,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  id,
  name,
  error,
  ...props
}) {
  // Base classes for styling
  const baseClasses = 'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors';
  
  // Add error styling if error prop is provided
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/30';
  
  // Combine all classes
  const inputClasses = `${baseClasses} ${errorClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`;
  
  return (
    <div className="w-full">
      <input
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  error: PropTypes.string
};

export default Input;