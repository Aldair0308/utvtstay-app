import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect, StackNavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { filesService } from '../../services/files';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme';

type AppStackParamList = {
  FileEdit: { fileId: number };
  FileHistory: { fileId: number; fileName: string };
};

type FileEditNavigationProp = StackNavigationProp<AppStackParamList, 'FileEdit'>;
type FileEditRouteProp = RouteProp<AppStackParamList, 'FileEdit'>;

interface EditorContent {
  file: {
    id: number;
    name: string;
    type: string;
    size: number;
    is_word: boolean;
    is_excel: boolean;
    is_pdf: boolean;
    editable: boolean;
  };
  content: {
    type: string;
    data: string;
    editable: boolean;
    message?: string;
  };
  version: number;
  total_versions: number;
  last_modified: string;
}

const FileEditScreen: React.FC = () => {
  const navigation = useNavigation<FileEditNavigationProp>();
  const route = useRoute<FileEditRouteProp>();
  const { fileId } = route.params;
  
  const [editorData, setEditorData] = useState<EditorContent | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Refs para mantener el foco del WebView
  const webViewRef = useRef<any>(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    loadFileForEdit();
  }, [fileId]);

  // Gestión del teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    // Configurar el header con botón de guardar
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !hasChanges}
          style={styles.headerButton}
        >
          <Text style={[
            styles.headerButtonText,
            (!hasChanges || saving) && styles.headerButtonTextDisabled
          ]}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, hasChanges]);

  // Sincronizar cambios de contenido con el WebView via JavaScript injection
  // Esto evita re-renders del WebView manteniendo el foco y el teclado abierto
  useEffect(() => {
    if (webViewRef.current && htmlContent) {
      // Usar JavaScript injection para actualizar el contenido sin re-render
      const script = `
        if (window.updateEditorContent && !window.isUpdatingFromReactNative) {
          window.updateEditorContent(${JSON.stringify(htmlContent)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [htmlContent]);

  // Crear HTML estático para WebView - SIN dependencias para evitar re-renders
  // El contenido se sincroniza via postMessage, no via re-render del HTML
  const editableHtml = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 16px;
          padding: 0;
          background-color: #ffffff;
          color: #333333;
          line-height: 1.6;
        }
        .editor {
          min-height: 400px;
          border: none;
          outline: none;
          font-size: 16px;
        }
        .editor:focus {
          outline: none;
        }
      </style>
    </head>
    <body>
      <div class="editor" contenteditable="true" id="editor"></div>
      <script>
        const editor = document.getElementById('editor');
        let lastContent = '';
        let isUpdatingFromReactNative = false;
        
        // Función para actualizar contenido desde React Native
        window.updateEditorContent = function(content) {
          if (content !== editor.innerHTML) {
            isUpdatingFromReactNative = true;
            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const startOffset = range ? range.startOffset : 0;
            const endOffset = range ? range.endOffset : 0;
            
            editor.innerHTML = content;
            lastContent = content;
            
            // Restaurar la selección/cursor
            try {
              if (range && editor.firstChild) {
                const newRange = document.createRange();
                const textNode = editor.firstChild.nodeType === Node.TEXT_NODE 
                  ? editor.firstChild 
                  : editor.firstChild.firstChild || editor.firstChild;
                
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                  const maxOffset = Math.min(startOffset, textNode.textContent.length);
                  newRange.setStart(textNode, maxOffset);
                  newRange.setEnd(textNode, Math.min(endOffset, textNode.textContent.length));
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              }
            } catch (e) {
              // Si falla la restauración del cursor, mantener el foco
              editor.focus();
            }
            
            setTimeout(() => {
              isUpdatingFromReactNative = false;
            }, 50);
          }
        };
        
        // Debounce para evitar actualizaciones excesivas
        let updateTimeout;
        editor.addEventListener('input', function() {
          if (isUpdatingFromReactNative) return;
          
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            const currentContent = editor.innerHTML;
            if (currentContent !== lastContent) {
              lastContent = currentContent;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'contentChanged',
                content: currentContent
              }));
            }
          }, 100); // Debounce de 100ms
        });
        
        // Mantener el foco en el editor
        editor.addEventListener('focus', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'editorFocused'
          }));
        });
        
        editor.addEventListener('blur', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'editorBlurred'
          }));
        });
        
        // Listener para mensajes desde React Native
        window.addEventListener('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'updateContent') {
              window.updateEditorContent(data.content);
            } else if (data.type === 'focus') {
              editor.focus();
            }
          } catch (e) {
            console.error('Error parsing message:', e);
          }
        });
        
        // Notificar que el editor está listo
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'editorReady'
        }));
      </script>
    </body>
    </html>
  `;
  }, []); // SIN dependencias - HTML completamente estático

  const verifyUserPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      
      if (!token) {
        console.error("[FileEditScreen] No hay token de autenticación");
        throw new Error("No estás autenticado. Por favor, inicia sesión nuevamente.");
      }
      
      if (!userData) {
        console.error("[FileEditScreen] No hay datos de usuario");
        throw new Error("No se encontraron datos de usuario. Por favor, inicia sesión nuevamente.");
      }
      
      const user = JSON.parse(userData);
      console.log("[FileEditScreen] Usuario verificado:", {
        userId: user.id,
        role: user.role,
        hasToken: !!token
      });
      
      return { user, token };
    } catch (error: any) {
      console.error("[FileEditScreen] Error verificando permisos:", error);
      throw error;
    }
  };

  const loadFileForEdit = async () => {
    if (!fileId) {
      console.error("[FileEditScreen] ID de archivo no válido:", fileId);
      Alert.alert('Error', 'ID de archivo no válido');
      setLoading(false);
      return;
    }

    try {
      console.log("[FileEditScreen] Iniciando carga de archivo para edición:", {
        fileId: fileId.toString(),
        timestamp: new Date().toISOString()
      });
      
      setLoading(true);
      
      // Verificar permisos del usuario antes de proceder
      const { user, token } = await verifyUserPermissions();
      
      console.log("[FileEditScreen] Token disponible:", token ? `${token.substring(0, 20)}...` : "No token");
      
      // Usar getFileContent en lugar de getEditorContent
      const fileContent = await filesService.getFileContent(fileId.toString());
      
      console.log("[FileEditScreen] Contenido cargado exitosamente:", {
        contentLength: fileContent?.content?.length || 0,
        mimeType: fileContent?.mimeType,
        hasHtml: !!fileContent?.html,
        hasContent: !!fileContent
      });
      
      // Verificar si el archivo tiene contenido editable (HTML o texto)
      const hasEditableContent = !!(fileContent?.html || fileContent?.content);
      const mimeType = fileContent?.mimeType || '';
      
      if (!hasEditableContent) {
        Alert.alert(
          'Archivo sin contenido',
          'Este archivo no tiene contenido disponible para editar.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // Crear estructura compatible con el componente existente
      const editorContent: EditorContent = {
        file: {
          id: fileId,
          name: 'Archivo', // Se puede obtener del contexto si está disponible
          type: mimeType,
          size: 0,
          is_word: false,
          is_excel: false,
          is_pdf: false,
          editable: true
        },
        content: {
          type: mimeType,
          data: fileContent?.html || fileContent?.content || '',
          editable: true
        },
        version: 1,
        total_versions: 1,
        last_modified: new Date().toISOString()
      };
      
      setEditorData(editorContent);
      setHtmlContent(fileContent?.html || fileContent?.content || '');
      
      // Reset changes flag
      setHasChanges(false);
    } catch (error: any) {
      console.error('[FileEditScreen] Error loading file for edit:', {
        fileId: fileId.toString(),
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'No se pudo cargar el archivo para editar';
      if (error.message.includes('403') || error.message.includes('permisos')) {
        errorMessage = 'No tienes permisos para editar este archivo';
      } else if (error.message.includes('404')) {
        errorMessage = 'El archivo no fue encontrado';
      }
      
      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fileId || !hasChanges) {
      console.log("[FileEditScreen] Save skipped:", {
        fileId: !!fileId,
        hasChanges,
        reason: !fileId ? "No fileId" : "No changes"
      });
      return;
    }

    try {
      console.log("[FileEditScreen] Iniciando guardado:", {
        fileId: fileId.toString(),
        contentLength: htmlContent?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      setSaving(true);
      
      // Verificar token antes de guardar
      const token = await AsyncStorage.getItem("userToken");
      console.log("[FileEditScreen] Token para guardado:", token ? `${token.substring(0, 20)}...` : "No token");
      
      await filesService.updateContentMobile(
        fileId.toString(),
        htmlContent,
        'Actualización desde móvil'
      );
      
      console.log("[FileEditScreen] Archivo guardado exitosamente");
      
      setHasChanges(false);
      Alert.alert('Éxito', 'Archivo guardado correctamente');
    } catch (error: any) {
      console.error('[FileEditScreen] Error saving file:', {
        fileId: fileId.toString(),
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
      Alert.alert('Error', error.message || 'No se pudo guardar el archivo');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar Cambios',
        '¿Estás seguro que deseas descartar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', onPress: () => navigation.goBack(), style: 'destructive' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };



  const onWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'contentChanged') {
        const newContent = message.content;
        if (newContent !== htmlContent) {
          setHtmlContent(newContent);
          setHasChanges(true);
        }
      } else if (message.type === 'editorReady') {
        // El editor está listo, enviar el contenido inicial
        if (htmlContent && webViewRef.current) {
          const script = `window.updateEditorContent(${JSON.stringify(htmlContent)}); true;`;
          webViewRef.current.injectJavaScript(script);
        }
        // Auto-focus después de cargar el contenido
        setTimeout(() => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript('document.getElementById("editor").focus(); true;');
          }
        }, 200);
      } else if (message.type === 'editorFocused') {
        isUserInteracting.current = true;
        // Mantener el teclado abierto cuando el editor tiene foco
        if (!keyboardVisible) {
          // Forzar que el teclado permanezca visible
          webViewRef.current?.requestFocus();
        }
      } else if (message.type === 'editorBlurred') {
        // Solo permitir que el teclado se cierre si el usuario no está interactuando
        setTimeout(() => {
          if (!isUserInteracting.current) {
            // El usuario ha dejado de interactuar, permitir que el teclado se cierre
          }
        }, 100);
      }
    } catch (error) {
      console.error('[FileEditScreen] Error parsing WebView message:', error);
    }
  };
  
  // Función para mantener el foco del WebView
  const maintainWebViewFocus = () => {
    if (webViewRef.current && keyboardVisible) {
      webViewRef.current.requestFocus();
    }
  };
  
  // Función para manejar toques en el contenedor
  const handleContainerPress = () => {
    isUserInteracting.current = true;
    maintainWebViewFocus();
    // Reset después de un tiempo
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 1000);
  };

  const navigateToHistory = () => {
    navigation.navigate('FileHistory', { 
      fileId, 
      fileName: editorData?.file.name || 'Archivo' 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando editor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!editorData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>No se pudo cargar el archivo</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFileForEdit}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Verificar si el archivo es editable
  if (!editorData.content.editable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>{editorData.file.name}</Text>
            <Text style={styles.versionBadge}>Versión {editorData.version}</Text>
          </View>
        </View>
        <View style={styles.nonEditableContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.nonEditableTitle}>Archivo no editable</Text>
          <Text style={styles.nonEditableSubtitle}>
            {editorData.content.message || 'Este tipo de archivo no se puede editar desde la aplicación móvil.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const screenHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleDiscard}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{editorData.file.name}</Text>
          <Text style={styles.versionBadge}>Versión {editorData.version} de {editorData.total_versions}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.historyButton}
          onPress={navigateToHistory}
        >
          <Ionicons name="time-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* File Info */}
      <View style={styles.fileInfo}>
        <Text style={styles.fileInfoText}>Tipo: {editorData.file.type}</Text>
        <Text style={styles.fileInfoText}>Tamaño: {(editorData.file.size / 1024).toFixed(1)} KB</Text>
      </View>

        {/* WebView Editor */}
        <TouchableOpacity 
          style={[styles.webViewContainer, { height: screenHeight - 200 }]}
          activeOpacity={1}
          onPress={handleContainerPress}
        >
          <WebView
            ref={webViewRef}
            key="stable-editor-webview"
            source={{ html: editableHtml }}
            style={styles.webView}
            onMessage={onWebViewMessage}
            scalesPageToFit={false}
            startInLoadingState={true}
            keyboardDisplayRequiresUserAction={false}
            hideKeyboardAccessoryView={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando editor...</Text>
              </View>
            )}
          />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.discardButton}
          onPress={handleDiscard}
        >
          <Text style={styles.discardButtonText}>Descartar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    marginTop: theme.spacing.lg,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  versionBadge: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  historyButton: {
    padding: theme.spacing.sm,
  },
  nonEditableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  nonEditableTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  nonEditableSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fileInfoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  webViewContainer: {
    flex: 1,
    margin: theme.spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: 30, // Espacio adicional para evitar botones de navegación de Android
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  discardButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  discardButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: theme.colors.textTertiary,
  },
});

export default FileEditScreen;