'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={`fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] ${className || ''}`}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full
        ${variant === 'default' ? 'bg-white border-gray-200' : ''}
        ${variant === 'destructive' ? 'group destructive border-red-500 bg-red-500 text-white' : ''}
        ${variant === 'success' ? 'border-green-500 bg-green-50 text-green-800' : ''}
        ${className || ''}`}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-gray-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-white group-[.destructive]:focus:ring-red-500 ${className || ''}`}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={`absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-50 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-500 ${className || ''}`}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={`text-sm font-semibold ${className || ''}`}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={`text-sm opacity-90 ${className || ''}`}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// PropTypes
ToastProvider.propTypes = {
  children: PropTypes.node,
};

ToastViewport.propTypes = {
  className: PropTypes.string,
};

Toast.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive', 'success']),
};

Toast.defaultProps = {
  variant: 'default',
};

ToastAction.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

ToastClose.propTypes = {
  className: PropTypes.string,
};

ToastTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

ToastDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};