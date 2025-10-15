import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Select component set
 * Custom dropdown select component
 */

// Main Select component
export function Select({ children, value, onValueChange, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

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

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, child => {
        if (child.type === SelectTrigger) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen,
            disabled,
            selectedValue
          });
        }
        if (child.type === SelectContent) {
          return React.cloneElement(child, {
            isOpen,
            selectedValue,
            onValueChange: handleValueChange
          });
        }
        return child;
      })}
    </div>
  );
}

Select.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  disabled: PropTypes.bool
};

// Select Trigger component
export function SelectTrigger({ 
  children, 
  className, 
  isOpen, 
  setIsOpen, 
  disabled, 
  selectedValue,
  ...props 
}) {
  const handleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

SelectTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  setIsOpen: PropTypes.func,
  disabled: PropTypes.bool,
  selectedValue: PropTypes.string
};

// Select Value component
export function SelectValue({ placeholder, selectedValue, children }) {
  return (
    <span className="block truncate">
      {selectedValue ? children : placeholder}
    </span>
  );
}

SelectValue.propTypes = {
  placeholder: PropTypes.string,
  selectedValue: PropTypes.string,
  children: PropTypes.node
};

// Select Content component
export function SelectContent({ 
  children, 
  className, 
  isOpen, 
  selectedValue, 
  onValueChange,
  ...props 
}) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className || ''}`}
      {...props}
    >
      <div className="py-1">
        {React.Children.map(children, child => {
          if (child.type === SelectItem) {
            return React.cloneElement(child, {
              selectedValue,
              onValueChange
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

SelectContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isOpen: PropTypes.bool,
  selectedValue: PropTypes.string,
  onValueChange: PropTypes.func
};

// Select Item component
export function SelectItem({ 
  children, 
  value, 
  className, 
  selectedValue, 
  onValueChange,
  ...props 
}) {
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${
        isSelected ? 'bg-blue-50 text-blue-900' : ''
      } ${className || ''}`}
      onClick={handleClick}
      {...props}
    >
      {isSelected && (
        <Check className="absolute right-2 h-4 w-4 text-blue-600" />
      )}
      <div className="pr-6">
        {children}
      </div>
    </div>
  );
}

SelectItem.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  selectedValue: PropTypes.string,
  onValueChange: PropTypes.func
};

const SelectComponents = {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
};

export default SelectComponents;