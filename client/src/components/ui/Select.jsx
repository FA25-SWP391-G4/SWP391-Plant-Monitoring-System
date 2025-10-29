import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select component with dropdown functionality
 * Compatible with the existing UI design system
 */
export const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectRef} className="relative" {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            value,
            onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger = ({ children, isOpen, setIsOpen, className = '', ...props }) => {
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`
        w-full flex items-center justify-between px-3 py-2 text-left
        border border-gray-300 dark:border-gray-600 rounded-md
        bg-white dark:bg-gray-700 
        text-gray-900 dark:text-white
        hover:bg-gray-50 dark:hover:bg-gray-600
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      <span className="block truncate">{children}</span>
      <ChevronDown 
        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'transform rotate-180' : ''
        }`} 
      />
    </button>
  );
};

export const SelectValue = ({ placeholder, value, children }) => {
  return (
    <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
      {children || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, isOpen, value, onValueChange, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`
        absolute z-50 w-full mt-1 py-1
        bg-white dark:bg-gray-700 
        border border-gray-300 dark:border-gray-600 
        rounded-md shadow-lg
        max-h-60 overflow-auto
        ${className}
      `}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            currentValue: value,
            onSelect: onValueChange,
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem = ({ value, children, currentValue, onSelect, className = '' }) => {
  const isSelected = currentValue === value;

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(value);
      }}
      className={`
        w-full text-left px-3 py-2 text-sm
        hover:bg-gray-100 dark:hover:bg-gray-600
        focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600
        ${isSelected 
          ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100' 
          : 'text-gray-900 dark:text-gray-300'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
};