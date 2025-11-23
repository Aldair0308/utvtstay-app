import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Image,
  ImageSourcePropType,
  BackHandler,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AppStackParamList, File } from "../../interfaces";
import { filesService } from "../../services/files";
import { theme } from "../../theme";
import LoadingScreen from "../../components/common/LoadingScreen";
import CustomAlert from "../../components/common/CustomAlert";
import useAlert from "../../hooks/useAlert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDateFormatter } from "../../hooks/useDateFormatter";

type FilesNavigationProp = StackNavigationProp<AppStackParamList, "Files">;

const FilesScreen: React.FC = () => {
  const navigation = useNavigation<FilesNavigationProp>();
  const { formatMediumDate } = useDateFormatter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "completed"
  >("all");
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
      console.error("Error loading files:", error);
      showError("No se pudieron cargar los archivos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFiles();
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        navigation.replace("Dashboard");
        return true;
      });
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.replace("Dashboard")}
            style={{ paddingHorizontal: 12 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ),
      });
      return () => {
        sub.remove();
      };
    }, [])
  );

  useEffect(() => {
    filterFiles();
  }, [searchQuery, selectedFilter, files]);

  const filterFiles = () => {
    let filtered = files;

    // Filtrar por estado
    if (selectedFilter !== "all") {
      if (selectedFilter === "completed") {
        filtered = filtered.filter(
          (file) => file.status === "completed" || file.completed === true
        );
      } else if (selectedFilter === "active") {
        filtered = filtered.filter(
          (file) => file.status !== "completed" && file.completed !== true
        );
      }
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (file.description &&
            file.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredFiles(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const handleFilePress = async (file: File) => {
    try {
      const fileData = await filesService.getFileById(file.id);
      const isCompleted = !!(
        fileData.completed || fileData.status === "completed"
      );
      navigation.navigate("FileDetail", {
        fileId: file.id,
        isCompleted,
      });
    } catch {
      navigation.navigate("FileDetail", { fileId: file.id });
    }
  };

  interface FileIconInfo {
    name?: string;
    color?: string;
    imageSource?: ImageSourcePropType;
  }

  const getFileIconInfo = (file: File): FileIconInfo => {
    const name = (file.name || "").toLowerCase();
    const mime = (file.mimeType || "").toLowerCase();

    if (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      mime.includes("msword") ||
      mime.includes("wordprocessingml")
    ) {
      return { imageSource: require("../../../assets/img/Word.png") };
    }

    if (
      name.endsWith(".xls") ||
      name.endsWith(".xlsx") ||
      mime.includes("excel") ||
      mime.includes("spreadsheetml")
    ) {
      return { imageSource: require("../../../assets/img/Excel.png") };
    }

    if (
      name.endsWith(".html") ||
      name.endsWith(".htm") ||
      mime.includes("html")
    ) {
      return { imageSource: require("../../../assets/img/html.png") };
    }

    if (mime.includes("pdf")) return { name: "file-pdf-box", color: "#D32F2F" };
    if (mime.includes("image"))
      return { name: "file-image-outline", color: theme.colors.textSecondary };
    if (mime.includes("video"))
      return { name: "file-video-outline", color: theme.colors.textSecondary };
    if (mime.includes("audio"))
      return { name: "file-music-outline", color: theme.colors.textSecondary };
    if (mime.includes("text"))
      return {
        name: "file-document-outline",
        color: theme.colors.textSecondary,
      };
    return { name: "file-outline", color: theme.colors.textSecondary };
  };

  const FileTypeIcon: React.FC<{
    imageSource?: ImageSourcePropType;
    iconName?: string;
    color?: string;
  }> = ({ imageSource, iconName, color }) => {
    if (!imageSource) {
      return (
        <MaterialCommunityIcons
          name={(iconName as any) || ("file-outline" as any)}
          size={24}
          color={color || theme.colors.textSecondary}
        />
      );
    }
    return (
      <Image
        source={imageSource}
        style={styles.fileIconImage}
        resizeMode={"contain"}
      />
    );
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return theme.colors.info; // azul para completados
    return theme.colors.success; // verde para no completados
  };

  const renderFileItem = ({ item }: { item: File }) => {
    const icon = getFileIconInfo(item);
    return (
      <TouchableOpacity
        style={styles.fileItem}
        onPress={() => handleFilePress(item)}
      >
        <View style={styles.fileIcon}>
          <FileTypeIcon
            imageSource={icon.imageSource}
            iconName={icon.name as any}
            color={icon.color}
          />
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
              {formatMediumDate(new Date(item.updatedAt))}
            </Text>
            <Text style={styles.fileSize}>
              {(item.size / 1024).toFixed(1)} KB
            </Text>
          </View>
          {item.status === "completed" && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completado</Text>
            </View>
          )}
        </View>
        <View style={styles.fileActions}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (
    filter: "all" | "active" | "completed",
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
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
        {renderFilterButton("all", "Todos")}
        {renderFilterButton("active", "Activos")}
        {renderFilterButton("completed", "Completados")}
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
              {searchQuery || selectedFilter !== "all"
                ? "No se encontraron archivos con los filtros aplicados"
                : "Aún no tienes archivos en tu cuenta"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Results Count */}
      {filteredFiles.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredFiles.length} archivo
            {filteredFiles.length !== 1 ? "s" : ""}
            {searchQuery &&
              ` encontrado${filteredFiles.length !== 1 ? "s" : ""}`}
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
    flexDirection: "row",
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
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: theme.colors.textLight,
  },
  listContainer: {
    padding: theme.spacing.screenPadding,
    paddingTop: theme.spacing.md,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    ...theme.components.card,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.dimensions.borderRadius.md,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
    overflow: "hidden",
  },
  fileIconImage: {
    width: "100%",
    height: "100%",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...theme.typography.styles.body,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  fileDescription: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  fileMetadata: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  completedBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.dimensions.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  completedBadgeText: {
    ...theme.typography.styles.caption,
    color: theme.colors.textLight,
    fontWeight: "600",
  },
  fileDate: {
    ...theme.typography.styles.caption,
  },
  fileSize: {
    ...theme.typography.styles.caption,
  },
  fileActions: {
    alignItems: "center",
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
    alignItems: "center",
    paddingVertical: theme.spacing["3xl"],
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
    textAlign: "center",
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
    textAlign: "center",
  },
});

export default FilesScreen;
