export const colors = {
  // Colores principales
  primary: '#10B981', // Verde principal
  primaryDark: '#059669',
  primaryLight: '#34D399',
  whiteBackground: '#FFFFFF',
  
  // Colores secundarios
  secondary: '#3B82F6', // Azul
  secondaryDark: '#1D4ED8',
  secondaryLight: '#60A5FA',
  
  // Colores de estado
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Colores de fondo
  background: '#F0F0F0',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  // Colores de superficie
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  
  // Colores de texto
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLight: '#FFFFFF',
  
  // Colores de borde
  border: '#E5E7EB',
  borderSecondary: '#D1D5DB',
  
  // Colores de sombra
  shadow: '#000000',
  
  // Colores específicos de la app
  utvGreen: '#10B981',
  utvBlue: '#1E40AF',
  
  // Estados de archivos
  fileActive: '#10B981',
  fileInactive: '#6B7280',
  fileDeleted: '#EF4444',
  
  // Estados de calendario
  eventPrimary: '#3B82F6',
  eventSecondary: '#8B5CF6',
  eventSuccess: '#10B981',
  eventWarning: '#F59E0B',
};

export type ColorKeys = keyof typeof colors;