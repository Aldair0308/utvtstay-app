import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  // Tamaños de fuente
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Pesos de fuente
  fontWeight: {
    light: '300' as TextStyle['fontWeight'],
    normal: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
  
  // Altura de línea
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Estilos de texto predefinidos
  styles: {
    h1: {
      fontSize: 30,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 36,
      color: colors.text,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 30,
      color: colors.text,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 26,
      color: colors.text,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 24,
      color: colors.text,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 22,
      color: colors.text,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
      color: colors.textTertiary,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 18,
      color: colors.text,
    },
  },
};

export type TypographyStyles = keyof typeof typography.styles;