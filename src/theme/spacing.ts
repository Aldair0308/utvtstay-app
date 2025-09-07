export const spacing = {
  // Espaciado base
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  
  // Espaciado específico
  none: 0,
  tiny: 2,
  small: 6,
  medium: 12,
  large: 20,
  xlarge: 28,
  huge: 40,
  
  // Padding y margin comunes
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
  
  // Espaciado vertical
  sectionSpacing: 24,
  itemSpacing: 16,
  elementSpacing: 8,
};

export const dimensions = {
  // Dimensiones de componentes
  buttonHeight: 48,
  inputHeight: 48,
  headerHeight: 56,
  tabBarHeight: 60,
  
  // Radios de borde
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Anchos de borde
  borderWidth: {
    none: 0,
    thin: 1,
    medium: 2,
    thick: 3,
  },
  
  // Tamaños de iconos
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  },
  
  // Tamaños de avatar
  avatarSize: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  },
};

export type SpacingKeys = keyof typeof spacing;
export type DimensionKeys = keyof typeof dimensions;