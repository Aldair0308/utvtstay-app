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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
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
  size: number;
  changes: string;
  isCurrentVersion: boolean;
  displayVersionLabel: string;
  isChecked: boolean;
}

const FileHistoryScreen: React.FC = () => {
  const navigation = useNavigation<FileHistoryNavigationProp>();
  const route = useRoute<FileHistoryRouteProp>();
  const { fileId } = route.params;
  const insets = useSafeAreaInsets();

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

      const baseHistory = historyData.map((item) => ({
        id: item.id.toString(),
        version: item.version,
        createdAt: item.created_at,
        size: item.content ? item.content.length : 0,
        changes: (() => {
          const raw = (item.changes_description || "").toString();
          const normalized = raw.trim().toLowerCase();
          const placeholder = "cambio incremental sin descripcion";
          if (!normalized || normalized === placeholder) return "";
          return raw;
        })(),
        isChecked: !!item.is_checked,
      }));

      const ascending = baseHistory.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        if (!isNaN(da) && !isNaN(db)) return da - db;
        return a.version - b.version;
      });

      const withLabels: FileHistoryItem[] = ascending.map((item, idx, arr) => ({
        ...item,
        displayVersionLabel: computeSequentialLabel(idx),
        isCurrentVersion: idx === arr.length - 1,
      }));

      setHistory(withLabels.slice().reverse());
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
      `Versión ${item.displayVersionLabel}`,
      `¿Qué deseas hacer con esta versión?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ver Contenido",
          onPress: () => viewVersionContent(item),
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
        versionLabel: item.displayVersionLabel,
      });
    } else {
      navigation.navigate("FileContentViewer", {
        changeId: item.id,
        title: displayFileName || "Archivo",
        version: item.version,
        versionLabel: item.displayVersionLabel,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const computeSequentialLabel = (index: number): string => {
    if (index <= 8) return `1.${index + 1}`;
    const offset = index - 9;
    const major = 2 + Math.floor(offset / 10);
    const minor = offset % 10;
    return `${major}.${minor}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 7) {
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (diffDays >= 1) {
      return diffDays === 1 ? "Hace 1 día" : `Hace ${diffDays} días`;
    }

    if (diffHours >= 1) {
      const h = diffHours;
      const m = diffMinutes % 60;
      if (m > 0) return `Hace ${h} y ${m} min`;
      return `Hace ${h}${h === 1 ? "hr" : "hrs"}`;
    }

    if (diffMinutes >= 1) {
      return `Hace ${diffMinutes} min`;
    }

    return "Hace segundos";
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
            Versión {item.displayVersionLabel}
            {item.isCurrentVersion && " (Actual)"}
          </Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          <View
            style={[
              styles.checkedBadge,
              item.isChecked
                ? styles.checkedBadgeChecked
                : styles.checkedBadgeUnchecked,
            ]}
          >
            <Text style={styles.checkedBadgeText}>
              {item.isChecked ? "Revisado ✓" : "Sin revisar"}
            </Text>
          </View>
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
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + theme.spacing.xs },
        ]}
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
  checkedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.dimensions.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  checkedBadgeChecked: {
    backgroundColor: theme.colors.success,
  },
  checkedBadgeUnchecked: {
    backgroundColor: theme.colors.warning,
  },
  checkedBadgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.textLight,
    fontWeight: "600",
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
