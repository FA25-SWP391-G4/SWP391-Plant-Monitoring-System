/**
 * Color Tokens - Extracted from web theme.css
 * Light theme is default; dark theme can be applied via context
 * 
 * Architecture:
 * - Primary colors: Green accent palette
 * - Semantic colors: Success, warning, error, info
 * - Background colors: Surfaces and panels
 * - Text colors: Primary, secondary, muted
 */

export const colors = {
  // Primary Green Palette (web theme)
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryLight: '#86efac',
  primaryBg: '#dcfce7',
  primaryHover: '#15803d',

  // Neutral Colors
  white: '#ffffff',
  black: '#000000',

  // Background Colors (Light Theme)
  backgroundLight: '#f8fafc',
  backgroundDark: '#f0fdf4',
  
  // Surface/Card Colors (Light Theme)
  surface: '#ffffff',
  surfaceHover: '#f7fee7',
  
  // Text Colors (Light Theme)
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',

  // Border & Shadow
  borderLight: '#e2e8f0',
  
  // Semantic Colors - Status
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#ef4444',
  errorBg: '#fee2e2',
  info: '#3b82f6',
  infoBg: '#dbeafe',

  // Component-Specific Semantic Colors
  statusSuccess: '#10b981',
  statusWarning: '#f59e0b',
  statusError: '#ef4444',
  
  // Icon & Interactive
  iconPrimary: '#1e293b',
  iconSecondary: '#64748b',
  iconMuted: '#94a3b8',

  // Dark Mode Overrides (when toggled)
  dark: {
    surface: '#1e1b2e',
    backgroundLight: '#0f0f23',
    backgroundDark: '#0c1c17',
    textPrimary: '#e2e8f0',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    borderLight: '#374151',
    successBg: '#064e3b',
    warningBg: '#78350f',
    errorBg: '#7f1d1d',
    infoBg: '#1e3a8a',
  },

  // Notification Colors
  notificationBell: '#666666',
  notificationBellHover: '#4caf50',
  notificationBadge: '#ff5252',
  notificationBadgeText: '#ffffff',
  
  // Transition/Animation overlay
  overlayDark: 'rgba(0, 0, 0, 0.3)',
};

export const getColorByStatus = (status) => {
  switch (status) {
    case 'success':
    case 'active':
    case 'completed':
      return colors.success;
    case 'warning':
    case 'pending':
    case 'running':
      return colors.warning;
    case 'error':
    case 'failed':
    case 'danger':
      return colors.error;
    case 'info':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

export const getBackgroundByStatus = (status) => {
  switch (status) {
    case 'success':
    case 'active':
    case 'completed':
      return colors.successBg;
    case 'warning':
    case 'pending':
    case 'running':
      return colors.warningBg;
    case 'error':
    case 'failed':
    case 'danger':
      return colors.errorBg;
    case 'info':
      return colors.infoBg;
    default:
      return colors.backgroundLight;
  }
};
