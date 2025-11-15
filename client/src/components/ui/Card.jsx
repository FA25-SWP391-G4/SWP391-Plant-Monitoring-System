import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component set
 * Inspired by the SWP391 design system
 */

// Main Card component
export function Card({ className, children, ...props }) {
  return (
    <div
      className={`bg-white text-gray-900 flex flex-col gap-4 rounded-lg border border-gray-200 p-6 shadow-sm ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

// Card Header component
export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={`flex flex-col space-y-1.5 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

// Card Title component
export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={`font-semibold text-lg leading-none tracking-tight ${className || ''}`}
      {...props}
    >
      {children}
    </h3>
  );
}

CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

// Card Description component
export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={`text-sm text-gray-500 ${className || ''}`}
      {...props}
    >
      {children}
    </p>
  );
}

CardDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

// Card Content component
export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={`px-1 pt-0 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

// Card Footer component
export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={`flex items-center pt-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

const CardComponents = {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};

export default CardComponents;