import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { filesService } from '../../services/files';
import { colors, spacing, typography } from '../../theme';
import { AppStackParamList } from '../../interfaces';

type FileContentViewerRouteProp = RouteProp<AppStackParamList, 'FileContentViewer'>;
type FileContentViewerNavigationProp = StackNavigationProp<AppStackParamList, 'FileContentViewer'>;

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
  const { fileId, changeId, title, version } = route.params;

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [fileId, changeId]);

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
        throw new Error('No se proporcionó ID de archivo o cambio');
      }

      setContent(contentData);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'No se pudo cargar el contenido del archivo');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!content) return null;

    const { content: fileContent, mimeType, html, content_type } = content;
    const screenHeight = Dimensions.get('window').height;

    // Si hay HTML disponible o el contenido es HTML, usar WebView
    if (html || content_type === 'html' || (mimeType && mimeType.includes('html'))) {
      const htmlContent = html || fileContent;
      return (
        <View style={[styles.webViewContainer, { height: screenHeight - 120 }]}>
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
    const isTextContent = mimeType && (
      mimeType.startsWith('text/') || 
      mimeType === 'application/json' ||
      mimeType === 'application/javascript' ||
      mimeType === 'application/xml'
    );

    if (isTextContent) {
      return (
        <ScrollView style={styles.contentContainer}>
          <Text style={styles.contentText}>{fileContent}</Text>
        </ScrollView>
      );
    } else {
      return (
        <View style={styles.nonTextContainer}>
          <Ionicons name="document-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.nonTextTitle}>Archivo no compatible</Text>
          <Text style={styles.nonTextSubtitle}>
            Este tipo de archivo ({mimeType || 'desconocido'}) no se puede visualizar en la aplicación.
          </Text>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          {version && (
            <Text style={styles.versionBadge}>v{version}</Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando contenido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {version && (
            <Text style={styles.versionBadge}>Versión {version}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.contentWrapper}>
        {content && (
          <View style={styles.mimeTypeInfo}>
            <Text style={styles.mimeTypeText}>Tipo: {content.mimeType}</Text>
          </View>
        )}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  versionBadge: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  contentWrapper: {
    flex: 1,
  },
  mimeTypeInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mimeTypeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
  },
  contentText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * 1.5,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  nonTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  nonTextTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  nonTextSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default FileContentViewer;