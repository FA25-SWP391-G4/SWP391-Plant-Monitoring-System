// Inspired by react-hot-toast library
import * as React from 'react'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export const ToastTypes = {
  DEFAULT: 'default',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Simple toast interface for our React project
export function useToast() {
  const [toasts, setToasts] = React.useState([])
  
  const toast = (message, options = {}) => {
    const id = Date.now().toString()
    const newToast = {
      id,
      message,
      type: options.type || ToastTypes.DEFAULT,
      duration: options.duration || 3000,
      ...options
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto dismiss after duration
    if (newToast.duration !== Infinity) {
      setTimeout(() => {
        dismissToast(id)
      }, newToast.duration)
    }
    
    return id
  }
  
  const dismissToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  const dismissAll = () => {
    setToasts([])
  }
  
  return {
    toast,
    dismissToast,
    dismissAll,
    toasts
  }
}

// Helper functions for different toast types
export function useToasts() {
  const { toast, dismissToast, dismissAll, toasts } = useToast()
  
  return {
    toast,
    success: (message, options) => toast(message, { ...options, type: ToastTypes.SUCCESS }),
    error: (message, options) => toast(message, { ...options, type: ToastTypes.ERROR }),
    warning: (message, options) => toast(message, { ...options, type: ToastTypes.WARNING }),
    info: (message, options) => toast(message, { ...options, type: ToastTypes.INFO }),
    dismissToast,
    dismissAll,
    toasts
  }
}