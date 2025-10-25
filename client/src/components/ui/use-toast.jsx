'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/Toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

// Custom event to create toasts
const createToastEvent = 'plant-system-create-toast';

// Custom event to dismiss toasts
const dismissToastEvent = 'plant-system-dismiss-toast';

// Generate a unique id for each toast
let count = 0;
const generateId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

// Toast queue
const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.toast].slice(-TOAST_LIMIT),
      };
    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
        ),
      };
    case actionTypes.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toastId ? { ...toast, open: false } : toast
        ),
      };
    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
      };
    default:
      return state;
  }
};

// Toast context
const ToastContext = React.createContext({});

const ToastContainer = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, {
    toasts: [],
  });

  React.useEffect(() => {
    const handleCreateToast = (event) => {
      const { toast } = event.detail;
      toast.id = toast.id || generateId();
      toast.open = true;

      dispatch({ type: actionTypes.ADD_TOAST, toast });
    };

    const handleDismissToast = (event) => {
      const { toastId } = event.detail;
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
    };

    window.addEventListener(createToastEvent, handleCreateToast);
    window.addEventListener(dismissToastEvent, handleDismissToast);
    
    return () => {
      window.removeEventListener(createToastEvent, handleCreateToast);
      window.removeEventListener(dismissToastEvent, handleDismissToast);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ ...state, dispatch }}>
      {children}
      <ToastProvider>
        {state.toasts.map(({ id, title, description, action, variant, open, ...props }) => (
          <Toast
            key={id}
            variant={variant}
            open={open}
            onOpenChange={(open) => {
              if (!open) {
                dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
              }
            }}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            <ToastClose />
            {action}
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
};

// Toast hook
const useToast = () => {
  const api = React.useMemo(() => {
    return {
      toast: (props) => {
        const id = props.id || generateId();
        
        // Create the toast
        const createEvent = new CustomEvent(createToastEvent, {
          detail: {
            toast: {
              ...props,
              id,
            },
          },
        });
        window.dispatchEvent(createEvent);
        
        // Setup automatic toast dismissal
        setTimeout(() => {
          const dismissEvent = new CustomEvent(dismissToastEvent, {
            detail: {
              toastId: id,
            },
          });
          window.dispatchEvent(dismissEvent);
        }, TOAST_REMOVE_DELAY);
        
        return {
          id,
          dismiss: () => {
            const dismissEvent = new CustomEvent(dismissToastEvent, {
              detail: {
                toastId: id,
              },
            });
            window.dispatchEvent(dismissEvent);
          },
        };
      },
      dismiss: (toastId) => {
        const dismissEvent = new CustomEvent(dismissToastEvent, {
          detail: {
            toastId,
          },
        });
        window.dispatchEvent(dismissEvent);
      },
    };
  }, []);
  
  return api;
};

// PropTypes
ToastContainer.propTypes = {
  children: PropTypes.node,
};

export { ToastContainer, useToast };