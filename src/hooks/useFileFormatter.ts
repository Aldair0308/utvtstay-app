import { useMemo } from 'react';

export const useFileFormatter = () => {
  const formatFileSize = useMemo(() => {
    return (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);
      
      // Formateo mejorado con mejor presentación visual
      if (i === 0) {
        // Bytes - mostrar número entero
        return `${Math.round(size)} ${sizes[i]}`;
      } else if (size >= 100) {
        // Para tamaños >= 100, mostrar sin decimales
        return `${Math.round(size)} ${sizes[i]}`;
      } else if (size >= 10) {
        // Para tamaños >= 10, mostrar 1 decimal
        return `${size.toFixed(1)} ${sizes[i]}`;
      } else {
        // Para tamaños < 10, mostrar 2 decimales
        return `${size.toFixed(2)} ${sizes[i]}`;
      }
    };
  }, []);

  const formatFileSizeCompact = useMemo(() => {
    return (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);
      
      // Versión compacta con abreviaciones más cortas
      if (i === 0) {
        return `${Math.round(size)} B`;
      } else if (size >= 100) {
        return `${Math.round(size)} ${sizes[i]}`;
      } else if (size >= 10) {
        return `${size.toFixed(1)} ${sizes[i]}`;
      } else {
        return `${size.toFixed(1)} ${sizes[i]}`;
      }
    };
  }, []);

  const formatFileSizeDetailed = useMemo(() => {
    return (bytes: number): string => {
      if (bytes === 0) return '0 bytes';
      
      const k = 1024;
      const sizes = ['bytes', 'kilobytes', 'megabytes', 'gigabytes', 'terabytes'];
      const sizesShort = ['bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const size = bytes / Math.pow(k, i);
      
      // Versión detallada con nombres completos para bytes
      if (i === 0) {
        const count = Math.round(size);
        return `${count} ${count === 1 ? 'byte' : 'bytes'}`;
      } else {
        const formattedSize = size >= 100 ? Math.round(size) : 
                            size >= 10 ? size.toFixed(1) : 
                            size.toFixed(2);
        return `${formattedSize} ${sizesShort[i]}`;
      }
    };
  }, []);

  return {
    formatFileSize,
    formatFileSizeCompact,
    formatFileSizeDetailed,
  };
};