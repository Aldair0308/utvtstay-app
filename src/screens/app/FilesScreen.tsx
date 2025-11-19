import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File } from '../../interfaces';
import { filesService } from '../../services/files';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';
import CustomAlert from '../../components/common/CustomAlert';
import useAlert from '../../hooks/useAlert';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Platform } from 'react-native';

type FilesNavigationProp = StackNavigationProp<AppStackParamList, 'Files'>;

const FilesScreen: React.FC = () => {
  const navigation = useNavigation<FilesNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { alertState, hideAlert, showError } = useAlert();

  const loadFiles = async () => {
    try {
      const response = await filesService.getFiles();
      setFiles(response.files);
      setFilteredFiles(response.files);
      if (refreshing) {
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showError('No se pudieron cargar los archivos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [])
  );

  useEffect(() => {
    filterFiles();
  }, [searchQuery, selectedFilter, files]);

  const filterFiles = () => {
    let filtered = files;

    // Filtrar por estado
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(file => file.status === selectedFilter);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredFiles(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const handleFilePress = (file: File) => {
    navigation.navigate('FileDetail', { fileId: file.id });
  };

  interface FileIconInfo {
    name?: string;
    color?: string;
    imageUri?: string;
  }

  const getFileIconInfo = (file: File): FileIconInfo => {
    const name = (file.name || '').toLowerCase();
    const mime = (file.mimeType || '').toLowerCase();

    if (
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      mime.includes('msword') ||
      mime.includes('wordprocessingml')
    ) {
      return { imageUri: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Microsoft_Word_2013-2019_logo.svg' };
    }

    if (
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      mime.includes('excel') ||
      mime.includes('spreadsheetml')
    ) {
      return { imageUri: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Microsoft_Excel_2013-2019_logo.svg' };
    }

    if (name.endsWith('.html') || name.endsWith('.htm') || mime.includes('html')) {
      return { imageUri: 'https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg' };
    }

    if (mime.includes('pdf')) return { name: 'file-pdf-box', color: '#D32F2F' };
    if (mime.includes('image')) return { name: 'file-image-outline', color: theme.colors.textSecondary };
    if (mime.includes('video')) return { name: 'file-video-outline', color: theme.colors.textSecondary };
    if (mime.includes('audio')) return { name: 'file-music-outline', color: theme.colors.textSecondary };
    if (mime.includes('text')) return { name: 'file-document-outline', color: theme.colors.textSecondary };
    return { name: 'file-outline', color: theme.colors.textSecondary };
  };

  const buildSvgHtml = (uri: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;"><img src="${uri}" style="width:100%;height:100%;object-fit:contain" /></body></html>`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.textTertiary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderFileItem = ({ item }: { item: File }) => {
    const icon = getFileIconInfo(item);
    return (
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => handleFilePress(item)}
      >
        <View style={styles.fileIcon}>
          {icon.imageUri ? (
            Platform.OS === 'web' ? (
              <Image
                source={{ uri: icon.imageUri }}
                style={styles.fileIconImage}
                resizeMode={'contain'}
              />
            ) : (
              <WebView
                source={{ html: buildSvgHtml(icon.imageUri) }}
                originWhitelist={["*"]}
                javaScriptEnabled={false}
                scrollEnabled={false}
                style={styles.fileIconWebView}
              />
            )
          ) : (
            <MaterialCommunityIcons name={icon.name as any} size={24} color={icon.color} />
          )}
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.fileDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.fileMetadata}>
            <Text style={styles.fileDate}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
            <Text style={styles.fileSize}>
              {(item.size / 1024).toFixed(1)} KB
            </Text>
          </View>
        </View>
        <View style={styles.fileActions}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.status) }
          ]} />
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filter: 'all' | 'active' | 'inactive', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Cargando archivos..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar archivos..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Todos')}
        {renderFilterButton('active', 'Activos')}
        {renderFilterButton('inactive', 'Inactivos')}
      </View>

      {/* Files List */}
      <FlatList
        data={filteredFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No hay archivos</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedFilter !== 'all'
                ? 'No se encontraron archivos con los filtros aplicados'
                : 'Aún no tienes archivos en tu cuenta'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Results Count */}
      {filteredFiles.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredFiles.length} archivo{filteredFiles.length !== 1 ? 's' : ''}
            {searchQuery && ` encontrado${filteredFiles.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={hideAlert}
        primaryButton={alertState.primaryButton}
        secondaryButton={alertState.secondaryButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  searchContainer: {
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    ...theme.components.input,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.dimensions.borderRadius.full,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.textLight,
  },
  listContainer: {
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.components.card,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.dimensions.borderRadius.md,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  fileIconWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fileIconImage: {
    width: '100%',
    height: '100%',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...theme.typography.styles.body,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  fileDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  fileMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fileDate: {
    ...theme.typography.styles.caption,
  },
  fileSize: {
    ...theme.typography.styles.caption,
  },
  fileActions: {
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  chevron: {
    ...theme.typography.styles.h3,
    color: theme.colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.styles.h3,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  resultsContainer: {
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.dimensions.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },
  resultsText: {
    ...theme.typography.styles.caption,
    textAlign: 'center',
  },
});

export default FilesScreen;
