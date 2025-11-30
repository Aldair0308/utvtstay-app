import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  BackHandler,
} from "react-native";
import { RouteProp, useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { filesService } from "../../services/files";
import { colors, spacing, typography } from "../../theme";
import { AppStackParamList } from "../../interfaces";
import ExcelEditor from "../../components/FileEditScreenExcel";

type FileContentViewerRouteProp = RouteProp<
  AppStackParamList,
  "FileContentViewer"
>;
type FileContentViewerNavigationProp = StackNavigationProp<
  AppStackParamList,
  "FileContentViewer"
>;

interface ContentData {
  content: string;
  mimeType?: string;
  html?: string;
  content_type?: string;
  has_new_content?: boolean;
  file_change?: {
    id: number;
    change_type: string;
    position_start: number;
    position_end: number;
    old_content: string;
    new_content: string;
    created_at: string;
    observations: string;
    is_checked: number;
  };
  file?: {
    id: number;
    name: string;
    mime_type: string;
    size: number;
  };
}

const FileContentViewer: React.FC = () => {
  const route = useRoute<FileContentViewerRouteProp>();
  const navigation = useNavigation<FileContentViewerNavigationProp>();
  const { fileId, changeId, title, version, versionLabel } = route.params;

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [observationsVisible, setObservationsVisible] = useState(false);
  const [changeTutorName, setChangeTutorName] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [fileId, changeId]);

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        navigation.goBack();
        return true;
      });

      // Configurar el header
      navigation.setOptions({
        title: title || "Contenido",
      });

      return () => {
        sub.remove();
      };
    }, [navigation, title])
  );

  const loadContent = async () => {
    try {
      setLoading(true);
      let contentData: ContentData;

      if (changeId) {
        // Obtener contenido de un cambio específico
        contentData = await filesService.getFileChangeContent(changeId);
      } else if (fileId) {
        // Obtener contenido del archivo actual
        contentData = await filesService.getFileContent(fileId);
      } else {
        throw new Error("No se proporcionó ID de archivo o cambio");
      }

      setContent(contentData);
    } catch (error) {
      console.error("Error loading content:", error);
      Alert.alert("Error", "No se pudo cargar el contenido del archivo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchChangeDetails = async () => {
      try {
        const id = changeId || content?.file_change?.id?.toString();
        if (!id) return;
        const details = await filesService.getFileChangeDetails(String(id));
        const userName =
          details?.user?.name || details?.file_change?.user?.name || null;
        setChangeTutorName(userName);
      } catch {}
    };
    if (observationsVisible) {
      fetchChangeDetails();
    }
  }, [observationsVisible, changeId, content]);

  const renderContent = () => {
    if (!content) return null;

    const { content: fileContent, mimeType, html, content_type } = content;

    // Primer intento: si parece JSON de hoja (contiene "rows"), renderizar como Excel
    try {
      const fcTrim = (fileContent || "").trim();
      if (fcTrim.startsWith("{") && fcTrim.includes('"rows"')) {
        const raw = JSON.parse(fcTrim);
        const sheets = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw?.sheets)
          ? raw.sheets
          : Array.isArray(raw)
          ? raw
          : [raw];
        const normalized = { content: sheets };
        return (
          <View style={styles.editorCard}>
            <ExcelEditor
              editorContent={{
                content: "",
                mime_type:
                  mimeType ||
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }}
              initialDataJson={normalized}
              readOnly={true}
              style={{ flex: 1 }}
            />
          </View>
        );
      }
    } catch (e) {}

    const isExcelMime =
      !!mimeType &&
      (mimeType.includes("spreadsheetml") ||
        mimeType.includes("ms-excel") ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const changeType = content_type || content?.file_change?.change_type;
    if (changeType === "json_data") {
      try {
        const raw = JSON.parse(fileContent || "{}");
        const sheets = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw?.sheets)
          ? raw.sheets
          : Array.isArray(raw)
          ? raw
          : [raw];
        const normalized = { content: sheets };
        return (
          <View style={styles.editorCard}>
            <ExcelEditor
              editorContent={{
                content: "",
                mime_type:
                  mimeType ||
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }}
              initialDataJson={normalized}
              readOnly={true}
              style={{ flex: 1 }}
            />
          </View>
        );
      } catch (e) {
        // Si falla el parseo, continuar con las demás heurísticas
      }
    }

    if (isExcelMime) {
      const base64 = fileContent || "";
      if (base64 && typeof base64 === "string") {
        return (
          <View style={styles.editorCard}>
            <ExcelEditor
              editorContent={{ content: base64, mime_type: mimeType }}
              readOnly={true}
              style={{ flex: 1 }}
            />
          </View>
        );
      }
    }

    try {
      const rawObj = JSON.parse(fileContent || "");
      const sheetsAuto = Array.isArray(rawObj?.content)
        ? rawObj.content
        : Array.isArray(rawObj?.sheets)
        ? rawObj.sheets
        : Array.isArray(rawObj)
        ? rawObj
        : [rawObj];
      const first = sheetsAuto && sheetsAuto[0];
      if (first && (first.rows || (typeof first === "object" && first))) {
        const normalized = { content: sheetsAuto };
        return (
          <View style={styles.editorCard}>
            <ExcelEditor
              editorContent={{
                content: "",
                mime_type:
                  mimeType ||
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }}
              initialDataJson={normalized}
              readOnly={true}
              style={{ flex: 1 }}
            />
          </View>
        );
      }
    } catch (e) {}

    // Si hay HTML disponible o el contenido es HTML, usar WebView
    if (
      html ||
      content_type === "html" ||
      (mimeType && mimeType.includes("html"))
    ) {
      const htmlContent = html || fileContent;
      return (
        <View style={styles.editorCard}>
          <WebView
            source={{ html: htmlContent }}
            style={styles.webView}
            scalesPageToFit={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando documento...</Text>
              </View>
            )}
          />
        </View>
      );
    }

    // Determinar si es texto plano
    const isTextContent =
      mimeType &&
      (mimeType.startsWith("text/") ||
        mimeType === "application/json" ||
        mimeType === "application/javascript" ||
        mimeType === "application/xml");

    if (isTextContent) {
      return (
        <View style={styles.editorCard}>
          <ScrollView
            style={styles.editorScroll}
            contentContainerStyle={styles.textScrollContent}
          >
            <Text style={styles.contentText}>{fileContent}</Text>
          </ScrollView>
        </View>
      );
    } else {
      return (
        <View style={styles.nonTextContainer}>
          <Ionicons
            name="document-outline"
            size={64}
            color={colors.text.secondary}
          />
          <Text style={styles.nonTextTitle}>Archivo no compatible</Text>
          <Text style={styles.nonTextSubtitle}>
            Este tipo de archivo ({mimeType || "desconocido"}) no se puede
            visualizar en la aplicación.
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando contenido...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>{renderContent()}</View>

      {content?.file_change ? (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.observeButton}
            onPress={() => setObservationsVisible(true)}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.observeButtonText}>Ver observaciones</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <Modal
        visible={observationsVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setObservationsVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setObservationsVisible(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={colors.text.primary}
                style={styles.modalHeaderIcon}
              />
              <Text style={styles.modalTitle}>Observaciones del cambio</Text>
              <TouchableOpacity
                style={styles.modalCloseIconButton}
                onPress={() => setObservationsVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            {content?.file_change && (
              <Text style={styles.modalSubtitle}>
                {changeTutorName
                  ? `Tutor: ${changeTutorName}`
                  : "Observación del tutor"}
              </Text>
            )}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalText}>
                {content?.file_change?.observations || "Sin observaciones"}
              </Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setObservationsVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const formatVersionDisplay = (v?: number): string => {
  if (v === undefined || v === null) return "";
  return `1.${v}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  bottomButtonContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  observeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    elevation: 2,
  },
  observeButtonText: {
    fontSize: typography.fontSize.base,
    color: "#FFFFFF",
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  editorScroll: {
    flex: 1,
  },
  textScrollContent: {
    padding: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    color: colors.text.primary,
    fontFamily: "monospace",
  },
  nonTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  nonTextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  nonTextSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: typography.fontSize.base * 1.4,
  },
  editorCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17,24,39,0.65)",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    top: Dimensions.get("window").height * 0.12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.secondary,
  },
  modalHeaderIcon: {
    marginRight: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseIconButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  modalScroll: {
    maxHeight: Dimensions.get("window").height * 0.5,
  },
  modalScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.fontSize.base * 1.5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: typography.fontSize.base,
    color: "#FFFFFF",
    fontWeight: typography.fontWeight.medium,
  },
});

export default FileContentViewer;
