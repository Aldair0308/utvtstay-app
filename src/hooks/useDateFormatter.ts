import { useMemo } from 'react';

// Tipos para las opciones de formateo
interface DateFormatOptions {
  includeTime?: boolean;
  format?: 'short' | 'medium' | 'long';
  relative?: boolean;
}

// Hook personalizado para formateo de fechas
export const useDateFormatter = () => {
  const formatters = useMemo(() => {
    /**
     * Formatea una fecha a formato legible en español
     */
    const formatDate = (dateString: string | Date | null | undefined, options: DateFormatOptions = {}): string => {
      if (!dateString) return 'Fecha no disponible';
      
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const defaultOptions: DateFormatOptions = {
        includeTime: false,
        format: 'long',
        relative: false
      };
      
      const config = { ...defaultOptions, ...options };
      
      if (config.relative) {
        return formatRelativeDate(date);
      }
      
      switch (config.format) {
        case 'short':
          return formatShortDate(date, config.includeTime);
        case 'medium':
          return formatMediumDate(date, config.includeTime);
        case 'long':
        default:
          return formatLongDate(date, config.includeTime);
      }
    };

    /**
     * Formatea fecha en formato corto (DD/MM/YYYY)
     */
    const formatShortDate = (date: Date, includeTime = false): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      let formatted = `${day}/${month}/${year}`;
      
      if (includeTime) {
        const timeString = formatTime12Hour(date);
        formatted += ` ${timeString}`;
      }
      
      return formatted;
    };

    /**
     * Formatea fecha en formato medio (DD MMM YYYY)
     */
    const formatMediumDate = (date: Date, includeTime = false): string => {
      const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      let formatted = `${day} ${month} ${year}`;
      
      if (includeTime) {
        const timeString = formatTime12Hour(date);
        formatted += ` ${timeString}`;
      }
      
      return formatted;
    };

    /**
     * Formatea fecha en formato largo (DD de MMMM de YYYY)
     */
    const formatLongDate = (date: Date, includeTime = false): string => {
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      let formatted = `${day} de ${month} de ${year}`;
      
      if (includeTime) {
        const timeString = formatTime12Hour(date);
        formatted += ` a las ${timeString}`;
      }
      
      return formatted;
    };

    /**
     * Formatea fecha de manera relativa (hace X tiempo)
     */
    const formatRelativeDate = (date: Date): string => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return 'Hace unos segundos';
      }
      
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
      }
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
      }
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
      }
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) {
        return `Hace ${diffInWeeks} semana${diffInWeeks !== 1 ? 's' : ''}`;
      }
      
      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) {
        return `Hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`;
      }
      
      const diffInYears = Math.floor(diffInDays / 365);
      return `Hace ${diffInYears} año${diffInYears !== 1 ? 's' : ''}`;
    };

    /**
     * Formatea solo la hora de una fecha en formato 12 horas
     */
    const formatTime12Hour = (date: Date): string => {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // La hora '0' debe ser '12'
      
      return `${hours}:${minutes} ${ampm}`;
    };

    /**
     * Formatea solo la hora de una fecha
     */
    const formatTime = (dateString: string | Date | null | undefined): string => {
      if (!dateString) return 'Hora no disponible';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Hora inválida';
      }
      
      return formatTime12Hour(date);
    };

    /**
     * Obtiene el nombre del día de la semana
     */
    const getDayName = (dateString: string | Date | null | undefined): string => {
      if (!dateString) return 'Día no disponible';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Día inválido';
      }
      
      const days = [
        'Domingo', 'Lunes', 'Martes', 'Miércoles', 
        'Jueves', 'Viernes', 'Sábado'
      ];
      
      return days[date.getDay()];
    };

    /**
     * Verifica si una fecha es hoy
     */
    const isToday = (dateString: string | Date | null | undefined): boolean => {
      if (!dateString) return false;
      
      const date = new Date(dateString);
      const today = new Date();
      
      return date.toDateString() === today.toDateString();
    };

    /**
     * Verifica si una fecha es ayer
     */
    const isYesterday = (dateString: string | Date | null | undefined): boolean => {
      if (!dateString) return false;
      
      const date = new Date(dateString);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      return date.toDateString() === yesterday.toDateString();
    };

    /**
     * Función principal que se puede usar directamente en las vistas
     * Detecta automáticamente el mejor formato según el contexto
     */
    const smartFormatDate = (dateString: string | Date | null | undefined): string => {
      if (!dateString) return 'Fecha no disponible';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      if (isToday(dateString)) {
        return `Hoy a las ${formatTime12Hour(date)}`;
      }
      
      if (isYesterday(dateString)) {
        return `Ayer a las ${formatTime12Hour(date)}`;
      }
      
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays < 7) {
        return `${getDayName(dateString)} a las ${formatTime12Hour(date)}`;
      }
      
      if (diffInDays < 365) {
        return formatDate(dateString, { format: 'medium', includeTime: true });
      }
      
      return formatDate(dateString, { format: 'short', includeTime: true });
    };

    return {
      formatDate,
      formatTime,
      getDayName,
      isToday,
      isYesterday,
      smartFormatDate,
      formatShortDate,
      formatMediumDate,
      formatLongDate,
      formatRelativeDate: (dateString: string | Date | null | undefined) => {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return formatRelativeDate(date);
      }
    };
  }, []);

  return formatters;
};

export default useDateFormatter;