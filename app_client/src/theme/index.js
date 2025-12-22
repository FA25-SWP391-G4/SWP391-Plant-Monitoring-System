/**
 * Theme Export - Single source of truth for all design tokens
 * 
 * Usage:
 * import { colors, spacing, typography } from '../theme';
 * 
 * or
 * 
 * import theme from '../theme';
 * // theme.colors, theme.spacing, theme.typography, etc.
 */

export { colors, getColorByStatus, getBackgroundByStatus } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows, elevations } from './shadows';
export { badgeColors, roleColors, getBadgeStyle, getRoleStyle } from './badges';

// Combined theme export
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows, elevations } from './shadows';
import { badgeColors, roleColors } from './badges';

const theme = {
  colors,
  spacing,
  typography,
  shadows,
  elevations,
  badgeColors,
  roleColors,
};

export default theme;
