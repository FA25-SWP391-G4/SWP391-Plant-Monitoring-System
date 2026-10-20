/**
 * Badge Color Mappings - Status and role indicators
 * Extracted from web badges.css and theme.css
 */

export const badgeColors = {
  // Status badges
  success: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderColor: '#6ee7b7',
  },
  warning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderColor: '#fcd34d',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderColor: '#fca5a5',
  },
  info: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderColor: '#93c5fd',
  },
  primary: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#86efac',
  },
  
  // Neutral badges
  default: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderColor: '#d1d5db',
  },
  
  // Muted badges
  muted: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    borderColor: '#d1d5db',
  },

  // Dark mode variants
  dark: {
    success: {
      backgroundColor: '#064e3b',
      color: '#86efac',
      borderColor: '#059669',
    },
    warning: {
      backgroundColor: '#78350f',
      color: '#fbbf24',
      borderColor: '#f59e0b',
    },
    error: {
      backgroundColor: '#7f1d1d',
      color: '#fca5a5',
      borderColor: '#ef4444',
    },
    info: {
      backgroundColor: '#1e3a8a',
      color: '#93c5fd',
      borderColor: '#3b82f6',
    },
    primary: {
      backgroundColor: '#166534',
      color: '#86efac',
      borderColor: '#22c55e',
    },
    default: {
      backgroundColor: '#374151',
      color: '#d1d5db',
      borderColor: '#4b5563',
    },
  },
};

export const roleColors = {
  admin: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderColor: '#fca5a5',
  },
  user: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderColor: '#93c5fd',
  },
  guest: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderColor: '#d1d5db',
  },
  owner: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderColor: '#fcd34d',
  },
  viewer: {
    backgroundColor: '#f5f3ff',
    color: '#5b21b6',
    borderColor: '#ddd6fe',
  },
};

export const getBadgeStyle = (type, isDark = false) => {
  const variants = isDark ? badgeColors.dark : badgeColors;
  return variants[type] || variants.default;
};

export const getRoleStyle = (role) => {
  return roleColors[role] || roleColors.guest;
};
