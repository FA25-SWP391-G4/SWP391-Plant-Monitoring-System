/**
 * Typography Tokens - Font sizes, weights, line heights
 * Extracted from web design system
 */

export const typography = {
  // Font weights
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Font sizes (in px)
  // Based on 16px base font size
  sizes: {
    xs: 11,      // Extra small (caption)
    sm: 12,      // Small
    base: 13,    // Base body text (adjusted for mobile)
    md: 14,      // Medium
    lg: 16,      // Large
    xl: 18,      // Extra large
    size2xl: 20, // 2x Large
    size3xl: 24, // 3x Large
    size4xl: 28, // 4x Large
    size5xl: 32, // 5x Large
    size6xl: 36, // 6x Large
    size7xl: 40, // 7x Large
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },

  // Text styles (preset combinations)
  styles: {
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.5,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.5,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    labelLarge: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 1.3,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0.5,
    },
  },
};
