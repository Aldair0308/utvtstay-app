import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File } from '../../interfaces';
import { filesService } from '../../services/files';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';

type FilesNavigationProp = StackNavigationProp<AppStackParamList, 'Files'>;

const FilesScreen: React.FC = () => {
  const navigation = useNavigation<FilesNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadFiles = async () => {
    try {
      const response = await filesService.getFiles();
      setFiles(response.files);
      setFilteredFiles(response.files);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'No se pudieron cargar los archivos');
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
        file.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
        return theme.colors.textSecondary;
    }
  };

  const renderFileItem = ({ item }: { item: File }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleFilePress(item)}
    >
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>{getFileIcon(item.mimeType)}</Text>
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
  fileIconText: {
    fontSize: 20,
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