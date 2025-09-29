import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File } from '../../interfaces';
import { filesService } from '../../services/files';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useFileFormatter } from '../../hooks/useFileFormatter';

type FileDetailNavigationProp = StackNavigationProp<AppStackParamList, 'FileDetail'>;
type FileDetailRouteProp = RouteProp<AppStackParamList, 'FileDetail'>;

const FileDetailScreen: React.FC = () => {
  const navigation = useNavigation<FileDetailNavigationProp>();
  const route = useRoute<FileDetailRouteProp>();
  const { fileId } = route.params;
  const { smartFormatDate } = useDateFormatter();
  const { formatFileSize } = useFileFormatter();
  
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');

  useEffect(() => {
    loadFileDetail();
  }, [fileId]);

  const loadFileDetail = async () => {
    try {
      const fileData = await filesService.getFileById(fileId);
      setFile(fileData);
      
      // Si es un archivo de texto, cargar el contenido actual
      if (fileData.mimeType.includes('text') || fileData.mimeType.includes('json')) {
        try {
          // Usar la misma lógica que FileHistoryScreen para obtener la versión actual
          const fileHistory = await filesService.getFileHistory(fileId);
          
          let content = '';
          if (fileHistory && fileHistory.length > 0) {
            // Mapear y ordenar igual que en FileHistoryScreen
            const mappedHistory = fileHistory.map((item, index) => ({
              id: item.id.toString(),
              version: item.version,
              isCurrentVersion: index === 0 // La primera versión es la más reciente
            }));
            
            // Ordenar por versión descendente (más reciente primero)
            const sortedHistory = mappedHistory.sort((a, b) => b.version - a.version);
            
            // Encontrar la versión actual (la primera después del ordenamiento)
            const currentVersion = sortedHistory[0];
            
            // Usar la misma lógica que FileContentViewer para obtener el contenido
            if (currentVersion.version === 1) {
              // Si es la versión 1, usar fileId para obtener el contenido del archivo original
              const contentData = await filesService.getFileContent(fileId);
              content = contentData.content || '';
            } else {
              // Si es otra versión, usar changeId para obtener el contenido del cambio
              const contentData = await filesService.getFileChangeContent(currentVersion.id);
              content = contentData.content || '';
            }
          } else {
            // Si no hay historial, usar getFileContent como fallback
            const contentData = await filesService.getFileContent(fileId);
            content = contentData.content || '';
          }
          
          setCurrentContent(content);
          setFileContent(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
        } catch (contentError) {
          console.error('Error loading file content:', contentError);
          setFileContent('No se pudo cargar el contenido del archivo');
          setCurrentContent('');
        }
      }
    } catch (error) {
      console.error('Error loading file detail:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (file) {
      // Pasar tanto el fileId como el contenido actual al editor
      navigation.navigate('FileEdit', { 
        fileId: file.id,
        initialContent: currentContent // Contenido de la versión más reciente
      });
    }
  };

  const handleViewHistory = () => {
    if (file) {
      navigation.navigate('FileHistory', { fileId: file.id });
    }
  };

  const handleShare = async () => {
    if (file) {
      try {
        await Share.share({
          message: `Compartiendo archivo: ${file.name}\n\nDescripción: ${file.description || 'Sin descripción'}`,
          title: file.name,
        });
      } catch (error) {
        console.error('Error sharing file:', error);
      }
    }
  };

  const handleDelete = () => {
    if (!file) return;
    
    Alert.alert(
      'Eliminar Archivo',
      `¿Estás seguro que deseas eliminar "${file.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await filesService.deleteFile(file.id);
              Alert.alert('Éxito', 'Archivo eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('text')) return '📝';
    return '📁';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.textTertiary;
      default:
        return theme.colors.success;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Activo';
    }
  };

  if (loading) {
    return <LoadingScreen message="Cargando archivo..." />;
  }

  if (!file) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Archivo no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* File Header */}
      <View style={styles.header}>
        <View style={styles.fileIconContainer}>
          <Text style={styles.fileIconLarge}>{getFileIcon(file.mimeType)}</Text>
        </View>
        <Text style={styles.fileName}>{file.name}</Text>
        {file.description && (
          <Text style={styles.fileDescription}>{file.description}</Text>
        )}
      </View>

      {/* File Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información del Archivo</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(file.status) }
            ]} />
            <Text style={[styles.infoValue, { color: getStatusColor(file.status) }]}>{getStatusText(file.status)}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tamaño:</Text>
          <Text style={styles.infoValue}>{formatFileSize(file.size)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creado:</Text>
          <Text style={styles.infoValue}>
            {smartFormatDate(file.createdAt)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modificado:</Text>
          <Text style={styles.infoValue}>
            {smartFormatDate(file.updatedAt)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión:</Text>
          <Text style={styles.infoValue}>{file.version}</Text>
        </View>
      </View>

      {/* File Content Preview */}
      {fileContent && (
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{fileContent}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionText}>Editar Archivo</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Ver Historial</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  fileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.dimensions.borderRadius.xl,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  fileIconLarge: {
    fontSize: 40,
  },
  fileName: {
    ...theme.typography.styles.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  fileDescription: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    margin: theme.spacing.screenPadding,
    ...theme.components.card,
  },
  contentSection: {
    margin: theme.spacing.screenPadding,
    marginTop: 0,
    ...theme.components.card,
  },
  actionsSection: {
    margin: theme.spacing.screenPadding,
    marginTop: 0,
    ...theme.components.card,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.styles.body,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  contentContainer: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.dimensions.borderRadius.md,
    padding: theme.spacing.md,
    maxHeight: 200,
  },
  contentText: {
    ...theme.typography.styles.bodySmall,
    fontFamily: 'monospace',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    width: 24,
  },
  actionText: {
    ...theme.typography.styles.body,
    flex: 1,
  },
  actionChevron: {
    ...theme.typography.styles.h4,
    color: theme.colors.textTertiary,
  },
  dangerAction: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: theme.colors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.typography.styles.h3,
    color: theme.colors.textSecondary,
  },
});

export default FileDetailScreen;