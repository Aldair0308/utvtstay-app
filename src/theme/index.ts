import { colors } from './colors';
import { typography } from './typography';
import { spacing, dimensions } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  dimensions,
  
  // Sombras predefinidas
  shadows: {
    small: {
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Estilos de componentes comunes
  components: {
    card: {
      backgroundColor: colors.surface,
      borderRadius: dimensions.borderRadius.lg,
      padding: spacing.cardPadding,
      ...{
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    },
    button: {
      primary: {
        backgroundColor: colors.primary,
        borderRadius: dimensions.borderRadius.md,
        height: dimensions.buttonHeight,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
      },
      secondary: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: dimensions.borderRadius.md,
        height: dimensions.buttonHeight,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        borderWidth: dimensions.borderWidth.thin,
        borderColor: colors.border,
      },
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: dimensions.borderRadius.md,
      height: dimensions.inputHeight,
      paddingHorizontal: spacing.inputPadding,
      borderWidth: dimensions.borderWidth.thin,
      borderColor: colors.border,
      fontSize: typography.fontSize.base,
      color: colors.text,
    },
  },
};

export * from './colors';
export * from './typography';
export * from './spacing';

export type Theme = typeof theme;