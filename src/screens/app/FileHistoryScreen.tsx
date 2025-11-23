import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  BackHandler,
} from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AppStackParamList, FileVersion } from "../../interfaces";
import { filesService } from "../../services/files";
import { theme } from "../../theme";
import LoadingScreen from "../../components/common/LoadingScreen";

type FileHistoryNavigationProp = StackNavigationProp<
  AppStackParamList,
  "FileHistory"
>;
type FileHistoryRouteProp = RouteProp<AppStackParamList, "FileHistory">;

interface FileHistoryItem {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  size: number;
  changes: string;
  isCurrentVersion: boolean;
}

const FileHistoryScreen: React.FC = () => {
  const navigation = useNavigation<FileHistoryNavigationProp>();
  const route = useRoute<FileHistoryRouteProp>();
  const { fileId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<FileHistoryItem[]>([]);
  const [displayFileName, setDisplayFileName] = useState<string>("");

  useFocusEffect(
    React.useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          navigation.replace("Files");
          return true;
        }
      );
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    const resolveHeader = async () => {
      try {
        const file = await filesService.getFileById(fileId);
        const name = file?.name || "";
        setDisplayFileName(name);
        navigation.setOptions({
          title: name ? `Historial: ${name}` : "Historial de Versiones",
        });
      } catch (_) {
        navigation.setOptions({ title: "Historial de Versiones" });
      }
    };
    resolveHeader();
    loadFileHistory();
  }, [fileId]);

  const loadFileHistory = async () => {
    try {
      const historyData = await filesService.getFileHistory(fileId);

      // Mapear los datos reales de la API al formato de la interfaz
      const mappedHistory: FileHistoryItem[] = historyData.map(
        (item, index) => ({
          id: item.id.toString(),
          version: item.version,
          createdAt: item.created_at,
          createdBy: `Usuario ${item.created_by}`, // En producción, esto debería ser el nombre real del usuario
          size: item.content ? item.content.length : 0, // Calcular tamaño basado en contenido
          changes: item.changes_description || "Sin descripción de cambios",
          isCurrentVersion: index === 0, // La primera versión es la más reciente
        })
      );

      // Ordenar por versión descendente (más reciente primero)
      const sortedHistory = mappedHistory.sort((a, b) => b.version - a.version);

      setHistory(sortedHistory);
    } catch (error) {
      console.error("Error loading file history:", error);
      Alert.alert("Error", "No se pudo cargar el historial del archivo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFileHistory();
  };

  const handleViewVersion = (item: FileHistoryItem) => {
    Alert.alert(
      `Versión ${item.version}`,
      `¿Qué deseas hacer con esta versión?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ver Contenido",
          onPress: () => viewVersionContent(item),
        },
        {
          text: "Restaurar",
          onPress: () => restoreVersion(item),
          style: "destructive",
        },
      ]
    );
  };

  const viewVersionContent = (item: FileHistoryItem) => {
    // Si es la versión 1, usar el fileId para obtener el contenido del archivo original
    // Si es otra versión, usar el changeId para obtener el contenido del cambio
    if (item.version === 1) {
      navigation.navigate("FileContentViewer", {
        fileId: fileId,
        title: displayFileName || "Archivo",
        version: item.version,
      });
    } else {
      navigation.navigate("FileContentViewer", {
        changeId: item.id,
        title: displayFileName || "Archivo",
        version: item.version,
      });
    }
  };

  const restoreVersion = (item: FileHistoryItem) => {
    Alert.alert(
      "Confirmar Restauración",
      `¿Estás seguro que deseas restaurar la versión ${item.version}? Esto creará una nueva versión con el contenido seleccionado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: () => performRestore(item),
          style: "destructive",
        },
      ]
    );
  };

  const performRestore = async (item: FileHistoryItem) => {
    try {
      await filesService.restoreFileVersion(fileId, item.version.toString());
      Alert.alert("Éxito", "Versión restaurada correctamente");
      loadFileHistory(); // Recargar historial
    } catch (error) {
      console.error("Error restoring version:", error);
      Alert.alert("Error", "No se pudo restaurar la versión");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hace 1 día";
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderHistoryItem = ({ item }: { item: FileHistoryItem }) => (
    <TouchableOpacity
      style={[
        styles.historyItem,
        item.isCurrentVersion && styles.currentVersionItem,
      ]}
      onPress={() => handleViewVersion(item)}
    >
      <View style={styles.itemHeader}>
        <View style={styles.versionInfo}>
          <Text
            style={[
              styles.versionNumber,
              item.isCurrentVersion && styles.currentVersionText,
            ]}
          >
            Versión {item.version}
            {item.isCurrentVersion && " (Actual)"}
          </Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.itemMeta}>
          <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
          {item.isCurrentVersion && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>ACTUAL</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.createdBy}>Por: {item.createdBy}</Text>

      <Text style={styles.changes}>{item.changes}</Text>

      <View style={styles.itemActions}>
        <Text style={styles.actionHint}>Toca para ver opciones</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen message="Cargando historial..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Versiones</Text>
        <Text style={styles.headerSubtitle}>
          {history.length} versiones disponibles
        </Text>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay historial disponible</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  header: {
    padding: theme.spacing.screenPadding,
    backgroundColor: theme.colors.background,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.styles.h3,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  listContainer: {
    padding: theme.spacing.screenPadding,
  },
  historyItem: {
    ...theme.components.card,
    marginBottom: theme.spacing.md,
  },
  currentVersionItem: {
    borderWidth: theme.dimensions.borderWidth.medium,
    borderColor: theme.colors.primary,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  versionInfo: {
    flex: 1,
  },
  versionNumber: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.xs,
  },
  currentVersionText: {
    color: theme.colors.primary,
  },
  itemDate: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
  },
  itemMeta: {
    alignItems: "flex-end",
  },
  fileSize: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  currentBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.dimensions.borderRadius.sm,
  },
  currentBadgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.textLight,
    fontWeight: "600",
  },
  createdBy: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  changes: {
    ...theme.typography.styles.body,
    marginBottom: theme.spacing.sm,
  },
  itemActions: {
    borderTopWidth: theme.dimensions.borderWidth.thin,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    alignItems: "center",
  },
  actionHint: {
    ...theme.typography.styles.caption,
    color: theme.colors.textTertiary,
    fontStyle: "italic",
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default FileHistoryScreen;
