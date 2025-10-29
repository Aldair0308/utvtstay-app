import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "react-native";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filesService } from "../../services/files";
import { useTheme } from "../../context/ThemeContext";
import { theme } from "../../theme";

type AppStackParamList = {
  FileEdit: { fileId: number; initialContent?: string };
  FileHistory: { fileId: number; fileName: string };
};

type FileEditNavigationProp = StackNavigationProp<
  AppStackParamList,
  "FileEdit"
>;
type FileEditRouteProp = RouteProp<AppStackParamList, "FileEdit">;

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
  const { fileId, initialContent } = route.params;

  const [editorData, setEditorData] = useState<EditorContent | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Estado para visualización de Excel
  const [isExcelView, setIsExcelView] = useState(false);
  const [excelDataBase64, setExcelDataBase64] = useState<string | null>(null);

  // Refs para mantener el foco del WebView
  const webViewRef = useRef<any>(null);
  const isUserInteracting = useRef(false);

  useEffect(() => {
    loadFileForEdit();
  }, [fileId]);

  // Gestión del teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    // Configurar el header con botón de guardar (solo para contenido editable)
    navigation.setOptions({
      headerRight: () => (
        isExcelView ? null : (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !hasChanges}
            style={styles.headerButton}
          >
            <Text
              style={[
                styles.headerButtonText,
                (!hasChanges || saving) && styles.headerButtonTextDisabled,
              ]}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Text>
          </TouchableOpacity>
        )
      ),
    });
  }, [navigation, saving, hasChanges, isExcelView]);

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
        
        // Sistema robusto de preservación del cursor
        function saveCursorPosition() {
          const selection = window.getSelection();
          if (selection.rangeCount === 0) return null;
          
          const range = selection.getRangeAt(0);
          const startContainer = range.startContainer;
          const startOffset = range.startOffset;
          const endContainer = range.endContainer;
          const endOffset = range.endOffset;
          
          // Calcular posición absoluta usando TreeWalker
          function getAbsoluteOffset(container, offset) {
            const walker = document.createTreeWalker(
              editor,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let absoluteOffset = 0;
            let currentNode;
            
            while (currentNode = walker.nextNode()) {
              if (currentNode === container) {
                return absoluteOffset + offset;
              }
              absoluteOffset += currentNode.textContent.length;
            }
            
            return absoluteOffset;
          }
          
          return {
            startOffset: getAbsoluteOffset(startContainer, startOffset),
            endOffset: getAbsoluteOffset(endContainer, endOffset),
            isCollapsed: range.collapsed
          };
        }
        
        function restoreCursorPosition(savedPosition) {
          if (!savedPosition) {
            editor.focus();
            return;
          }
          
          try {
            const walker = document.createTreeWalker(
              editor,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let currentOffset = 0;
            let startNode = null;
            let startOffset = 0;
            let endNode = null;
            let endOffset = 0;
            let currentNode;
            
            // Encontrar nodos para start y end
            while (currentNode = walker.nextNode()) {
              const nodeLength = currentNode.textContent.length;
              
              // Encontrar posición de inicio
              if (!startNode && currentOffset + nodeLength >= savedPosition.startOffset) {
                startNode = currentNode;
                startOffset = savedPosition.startOffset - currentOffset;
              }
              
              // Encontrar posición de fin
              if (!endNode && currentOffset + nodeLength >= savedPosition.endOffset) {
                endNode = currentNode;
                endOffset = savedPosition.endOffset - currentOffset;
                break;
              }
              
              currentOffset += nodeLength;
            }
            
            // Crear y aplicar el rango
            if (startNode) {
              const range = document.createRange();
              const selection = window.getSelection();
              
              // Validar offsets
              startOffset = Math.min(startOffset, startNode.textContent.length);
              endOffset = endNode ? Math.min(endOffset, endNode.textContent.length) : startOffset;
              
              range.setStart(startNode, startOffset);
              range.setEnd(endNode || startNode, endOffset);
              
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // Fallback: posicionar al final del contenido
              const range = document.createRange();
              const selection = window.getSelection();
              range.selectNodeContents(editor);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } catch (e) {
            console.error('Error restoring cursor:', e);
            editor.focus();
          }
        }
        
        // Función para actualizar contenido desde React Native
        window.updateEditorContent = function(content) {
          if (content !== editor.innerHTML) {
            isUpdatingFromReactNative = true;
            
            // Guardar posición del cursor antes de actualizar
            const savedPosition = saveCursorPosition();
            
            // Actualizar contenido
            editor.innerHTML = content;
            lastContent = content;
            
            // Restaurar posición del cursor
            setTimeout(() => {
              restoreCursorPosition(savedPosition);
              isUpdatingFromReactNative = false;
            }, 10);
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

  // HTML para visualizar Excel (solo lectura)
  const excelHtml = useMemo(() => {
    const base64 = excelDataBase64 || '';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Excel Editor</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #fff; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #e5e5e5; background: #f7f7f7; }
        .btn { font-size: 14px; color: #555; cursor: pointer; }
        .container { padding: 8px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; min-width: 60px; }
        th { background: #fafafa; }
        td { outline: none; }
        td[contenteditable="true"]:focus { box-shadow: inset 0 0 0 2px #3b82f6; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    </head>
    <body>
      <div class="toolbar">
        <span class="btn" id="btn-save">Guardar Cambios</span>
        <span class="btn" id="btn-undo">Deshacer</span>
        <span class="btn" id="btn-redo">Rehacer</span>
        <span class="btn" id="btn-export">Exportar XLSX</span>
        <label class="btn" for="file-import">Importar XLSX</label>
        <input type="file" id="file-import" accept=".xlsx" style="display:none" />
      </div>
      <div class="container">
        <div id="sheet"></div>
      </div>
      <script>
        function base64ToBinary(b64) {
          try {
            var s = (b64 || '');
            // Quitar prefijo data: si existe
            s = s.replace(/^data:[^;]+;base64,/, '');
            // Normalizar base64-url a estándar
            s = s.replace(/-/g, '+').replace(/_/g, '/');
            // Completar padding
            while (s.length % 4 !== 0) s += '=';
            var binaryString = atob(s);
            var len = binaryString.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            return bytes;
          } catch (e) {
            console.error('[Excel Debug] base64 decode failed:', e);
            return null;
          }
        }

        // Historial simple para deshacer/rehacer
        const history = []; let historyIndex = -1; let grid = [];

        function pushHistory() {
          history.splice(historyIndex + 1);
          history.push(JSON.stringify(grid));
          historyIndex = history.length - 1;
        }

        function renderTable() {
          const container = document.getElementById('sheet');
          const rows = grid.length;
          const cols = Math.max(...grid.map(r => r.length), 0);
          let html = '<table><thead><tr>';
          for (let c = 0; c < cols; c++) html += '<th>' + String.fromCharCode(65 + c) + '</th>';
          html += '</tr></thead><tbody>';
          for (let r = 0; r < Math.max(rows, 20); r++) {
            html += '<tr>';
            for (let c = 0; c < Math.max(cols, 10); c++) {
              const val = (grid[r] && grid[r][c]) ? grid[r][c] : '';
              html += '<td contenteditable="true" data-r="' + r + '" data-c="' + c + '">' + (val === undefined ? '' : String(val)) + '</td>';
            }
            html += '</tr>';
          }
          html += '</tbody></table>';
          container.innerHTML = html;
          bindCellEvents();
        }

        function bindCellEvents() {
          const cells = document.querySelectorAll('td[contenteditable="true"]');
          cells.forEach(cell => {
            cell.addEventListener('input', () => {
              const r = parseInt(cell.getAttribute('data-r'));
              const c = parseInt(cell.getAttribute('data-c'));
              if (!grid[r]) grid[r] = [];
              grid[r][c] = cell.textContent || '';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelChanged' }));
            });
          });
        }

        function workbookToGrid(wb) {
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          // Obtener matriz de arrays
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
          grid = aoa.map(row => row.map(cell => (cell === undefined ? '' : cell)));
          pushHistory();
          renderTable();
        }

        function gridToWorkbook() {
          const ws = XLSX.utils.aoa_to_sheet(grid);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          return wb;
        }

        // Inicializar desde base64
        (function(){
          const b64 = ${JSON.stringify(base64)};
          const container = document.getElementById('sheet');
          if (typeof XLSX === 'undefined') {
            container.innerHTML = '<p style="color:#c00; padding:8px">No se pudo cargar la librería XLSX. Verifica conexión o permisos del WebView.</p>';
            console.error('Excel render error: XLSX library not loaded');
            return;
          }
          const bytes = base64ToBinary(b64);
          if (!bytes) {
            container.innerHTML = '<p style="color:#c00; padding:8px">No se pudo cargar el contenido del Excel (base64 inválido).</p>';
            return;
          }
          try {
            const wb = XLSX.read(bytes, { type: 'array' });
            workbookToGrid(wb);
          } catch (err) {
            container.innerHTML = '<p style="color:#c00; padding:8px">Error al procesar el archivo Excel.</p>';
            console.error('Excel render error', err);
          }
        })();

        // Botones
        document.getElementById('btn-save').addEventListener('click', function(){
          try {
            const wb = gridToWorkbook();
            const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelSave', base64: b64 }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelError', message: 'Error al generar XLSX' }));
          }
        });
        document.getElementById('btn-export').addEventListener('click', function(){
          try {
            const wb = gridToWorkbook();
            const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelExport', base64: b64 }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelError', message: 'Error al exportar XLSX' }));
          }
        });
        document.getElementById('file-import').addEventListener('change', function(evt){
          const file = evt.target.files && evt.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function(e){
            try {
              const data = new Uint8Array(e.target.result);
              const wb = XLSX.read(data, { type: 'array' });
              workbookToGrid(wb);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelImported' }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'excelError', message: 'Error al importar XLSX' }));
            }
          };
          reader.readAsArrayBuffer(file);
        });
        document.getElementById('btn-undo').addEventListener('click', function(){
          if (historyIndex > 0) {
            historyIndex--; grid = JSON.parse(history[historyIndex]); renderTable();
          }
        });
        document.getElementById('btn-redo').addEventListener('click', function(){
          if (historyIndex < history.length - 1) {
            historyIndex++; grid = JSON.parse(history[historyIndex]); renderTable();
          }
        });
      </script>
    </body>
    </html>
    `;
  }, [excelDataBase64]);

  const verifyUserPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");

      if (!token) {
        console.error("[FileEditScreen] No hay token de autenticación");
        throw new Error(
          "No estás autenticado. Por favor, inicia sesión nuevamente."
        );
      }

      if (!userData) {
        console.error("[FileEditScreen] No hay datos de usuario");
        throw new Error(
          "No se encontraron datos de usuario. Por favor, inicia sesión nuevamente."
        );
      }

      const user = JSON.parse(userData);
      console.log("[FileEditScreen] Usuario verificado:", {
        userId: user.id,
        role: user.role,
        hasToken: !!token,
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
      Alert.alert("Error", "ID de archivo no válido");
      setLoading(false);
      return;
    }

    try {
      console.log("[FileEditScreen] Iniciando carga de archivo para edición:", {
        fileId: fileId.toString(),
        hasInitialContent: !!initialContent,
        timestamp: new Date().toISOString(),
      });

      setLoading(true);
      // Verificar permisos del usuario antes de proceder
      const { user, token } = await verifyUserPermissions();

      console.log(
        "[FileEditScreen] Token disponible:",
        token ? `${token.substring(0, 20)}...` : "No token"
      );

      // Intentar cargar contenido del editor desde el backend
      try {
        const editorResponse = await filesService.getEditorContent(
          fileId.toString()
        );

        // Caso: contenido HTML editable (Word)
        if (editorResponse?.content?.editable && (editorResponse.content.type === "html" || editorResponse.content.type?.includes("html"))) {
          const editorContent: EditorContent = {
            file: {
              id: fileId,
              name: editorResponse.file?.name || "Archivo",
              type: editorResponse.file?.type || "text/html",
              size: editorResponse.file?.size || 0,
              is_word: !!editorResponse.file?.is_word,
              is_excel: !!editorResponse.file?.is_excel,
              is_pdf: !!editorResponse.file?.is_pdf,
              editable: true,
            },
            content: {
              type: "text/html",
              data: editorResponse.content.data || "",
              editable: true,
              message: editorResponse.content?.message,
            },
            version: editorResponse.version || 1,
            total_versions: editorResponse.total_versions || 1,
            last_modified:
              editorResponse.last_modified || new Date().toISOString(),
          };

          setEditorData(editorContent);
          setHtmlContent(editorResponse.content.data || "");
          setHasChanges(false);
          return; // ya cargamos contenido editable en WebView
        }
        // Caso: Excel (solo visualización)
        if (editorResponse?.file?.is_excel || editorResponse?.content?.type === 'excel') {
          try {
            const contentData = await filesService.getFileContent(fileId.toString());
            // Se espera contenido en base64 del XLSX
            const excelBase64 = contentData?.content || '';

            const editorContent: EditorContent = {
              file: {
                id: fileId,
                name: editorResponse.file?.name || "Archivo",
                type: editorResponse.file?.type || contentData?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 0,
                is_word: false,
                is_excel: true,
                is_pdf: false,
                editable: false,
              },
              content: {
                type: 'excel',
                data: excelBase64,
                editable: false,
                message: editorResponse?.content?.message,
              },
              version: editorResponse.version || 1,
              total_versions: editorResponse.total_versions || 1,
              last_modified: editorResponse.last_modified || new Date().toISOString(),
            };

            setExcelDataBase64(excelBase64);
            setIsExcelView(true);
            setEditorData(editorContent);
            setHasChanges(false);
            return; // cargamos visor de Excel
          } catch (excelError) {
            console.warn('[FileEditScreen] Error cargando contenido Excel:', excelError);
            const nonEditableMsg = editorResponse?.content?.message || 'Este archivo no es editable en la aplicación móvil.';
            Alert.alert('Vista de Excel no disponible', nonEditableMsg, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
            return;
          }
        }

        // No editable y no Excel, mostrar aviso y salir
        const nonEditableMsg = editorResponse?.content?.message || "Este archivo no es editable en la aplicación móvil.";
        Alert.alert("Archivo no editable", nonEditableMsg, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      } catch (editorError) {
        console.warn(
          "[FileEditScreen] No fue posible cargar editor-content, usando fallback:",
          editorError
        );
      }

      // Fallback: evitar /editor-content para Excel; obtener contenido directo del archivo
      let content = '';
      let mimeType = 'text/html';
      try {
        const contentData = await filesService.getFileContent(fileId.toString());
        content = contentData?.html || contentData?.content || '';
        mimeType = contentData?.mimeType || 'text/html';
      } catch (contentErr) {
        console.warn('[FileEditScreen] Error en getFileContent, intentando historial:', contentErr);
        try {
          const fileHistory = await filesService.getFileHistory(fileId);
          if (fileHistory && fileHistory.length > 0) {
            const mappedHistory = fileHistory.map((item, index) => ({
              id: item.id.toString(),
              version: item.version,
              isCurrentVersion: index === 0
            }));
            const sortedHistory = mappedHistory.sort((a, b) => b.version - a.version);
            const currentVersion = sortedHistory[0];
            console.log('[FileEditScreen] Versión actual encontrada:', { version: currentVersion.version, id: currentVersion.id });
            // Evitar llamar a /file-changes/... para Excel conocido; preferir contenido directo
            const contentData = await filesService.getFileContent(fileId.toString());
            content = contentData?.html || contentData?.content || '';
            mimeType = contentData?.mimeType || 'text/html';
          }
        } catch (historyError) {
          console.warn('[FileEditScreen] Fallback final sin historial:', historyError);
        }
      }

      console.log("[FileEditScreen] Contenido cargado exitosamente:", {
        contentLength: content?.length || 0,
        mimeType: mimeType,
        hasContent: !!content,
      });

      // Verificar si el archivo tiene contenido editable
      if (!content) {
        Alert.alert(
          "Archivo sin contenido",
          "Este archivo no tiene contenido disponible para editar.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Si el contenido es un Excel, habilitar visor y no editor
      const isExcelMime =
        mimeType?.includes("spreadsheetml") ||
        mimeType?.includes("ms-excel") ||
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (isExcelMime) {
        const editorContentExcel: EditorContent = {
          file: {
            id: fileId,
            name: "Archivo",
            type: mimeType,
            size: 0,
            is_word: false,
            is_excel: true,
            is_pdf: false,
            editable: false,
          },
          content: {
            type: "excel",
            data: content, // base64 esperado
            editable: false,
          },
          version: 1,
          total_versions: 1,
          last_modified: new Date().toISOString(),
        };

        setExcelDataBase64(content);
        setIsExcelView(true);
        setEditorData(editorContentExcel);
        setHasChanges(false);
        return;
      }

      // Contenido no Excel: usar editor HTML
      const editorContentHtml: EditorContent = {
        file: {
          id: fileId,
          name: "Archivo", // Se puede obtener del contexto si está disponible
          type: mimeType,
          size: 0,
          is_word: false,
          is_excel: false,
          is_pdf: false,
          editable: true,
        },
        content: {
          type: mimeType,
          data: content,
          editable: true,
        },
        version: 1,
        total_versions: 1,
        last_modified: new Date().toISOString(),
      };

      setEditorData(editorContentHtml);
      setHtmlContent(content);
      setHasChanges(false);
    } catch (error: any) {
      console.error("[FileEditScreen] Error loading file for edit:", {
        fileId: fileId.toString(),
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });

      let errorMessage = "No se pudo cargar el archivo para editar";
      if (error.message.includes("403") || error.message.includes("permisos")) {
        errorMessage = "No tienes permisos para editar este archivo";
      } else if (error.message.includes("404")) {
        errorMessage = "El archivo no fue encontrado";
      }

      Alert.alert("Error", errorMessage);
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
        reason: !fileId ? "No fileId" : "No changes",
      });
      return;
    }

    try {
      console.log("[FileEditScreen] Iniciando guardado:", {
        fileId: fileId.toString(),
        contentLength: htmlContent?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Protección: evitar enviar contenido vacío al endpoint
      if (!htmlContent || htmlContent.trim().length === 0) {
        console.warn('[FileEditScreen] Intento de guardado con contenido vacío, abortando.');
        Alert.alert('Contenido vacío', 'No se puede guardar un archivo con contenido vacío. Verifica el contenido antes de guardar.');
        return;
      }

      setSaving(true);

      // Verificar token antes de guardar
      const token = await AsyncStorage.getItem("userToken");
      console.log(
        "[FileEditScreen] Token para guardado:",
        token ? `${token.substring(0, 20)}...` : "No token"
      );

      await filesService.updateContentMobile(
        fileId.toString(),
        htmlContent,
        "Actualización desde móvil"
      );

      console.log("[FileEditScreen] Archivo guardado exitosamente");

      setHasChanges(false);
      Alert.alert("Éxito", "Archivo guardado correctamente");
    } catch (error: any) {
      console.error("[FileEditScreen] Error saving file:", {
        fileId: fileId.toString(),
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      Alert.alert("Error", error.message || "No se pudo guardar el archivo");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (hasChanges) {
      Alert.alert(
        "Descartar Cambios",
        "¿Estás seguro que deseas descartar los cambios?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Descartar",
            onPress: () => navigation.goBack(),
            style: "destructive",
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Guardado para Excel: recibe base64 generado en el WebView
  const handleExcelSaveBase64 = async (excelBase64: string, versionMsg?: string) => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("userToken");
      console.log("[FileEditScreen] Token para guardado Excel:", token ? `${token.substring(0, 20)}...` : "No token");

      // Protección: validar base64 antes de enviar
      if (!excelBase64 || excelBase64.trim().length === 0) {
        console.warn('[FileEditScreen] Intento de guardado Excel con base64 vacío, abortando.');
        Alert.alert('Contenido vacío', 'El contenido de la hoja de cálculo está vacío. Asegúrate de exportar o generar el XLSX antes de guardar.');
        setSaving(false);
        return;
      }

      console.log('[FileEditScreen] Excel base64 length:', excelBase64.length);

      await filesService.updateContentMobile(
        fileId.toString(),
        excelBase64,
        versionMsg || "Actualización Excel desde móvil"
      );

      console.log("[FileEditScreen] Excel guardado exitosamente");
      setHasChanges(false);
      Alert.alert("Éxito", "Hoja de cálculo guardada correctamente");
    } catch (error: any) {
      console.error("[FileEditScreen] Error guardando Excel:", {
        fileId: fileId.toString(),
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString(),
      });
      Alert.alert("Error", error.message || "No se pudo guardar el Excel");
    } finally {
      setSaving(false);
    }
  };

  const onWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "contentChanged") {
        const newContent = message.content;
        if (newContent !== htmlContent) {
          setHtmlContent(newContent);
          setHasChanges(true);
        }
      } else if (message.type === 'excelChanged') {
        setHasChanges(true);
      } else if (message.type === 'excelSave') {
        if (message.base64) {
          handleExcelSaveBase64(message.base64, 'Actualización Excel desde móvil');
        }
      } else if (message.type === 'excelExport') {
        if (message.base64) {
          handleExcelSaveBase64(message.base64, 'Exportado XLSX desde móvil');
        }
      } else if (message.type === 'excelError') {
        Alert.alert('Error Excel', message.message || 'Ocurrió un error en el editor Excel');
      } else if (message.type === 'excelImported') {
        setHasChanges(true);
      } else if (message.type === "editorReady") {
        // El editor está listo, enviar el contenido inicial
        if (htmlContent && webViewRef.current) {
          const script = `window.updateEditorContent(${JSON.stringify(
            htmlContent
          )}); true;`;
          webViewRef.current.injectJavaScript(script);
        }
        // Auto-focus después de cargar el contenido
        setTimeout(() => {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(
              'document.getElementById("editor").focus(); true;'
            );
          }
        }, 200);
      } else if (message.type === "editorFocused") {
        isUserInteracting.current = true;
        // Mantener el teclado abierto cuando el editor tiene foco
        if (!keyboardVisible) {
          // Forzar que el teclado permanezca visible
          webViewRef.current?.requestFocus();
        }
      } else if (message.type === "editorBlurred") {
        // Solo permitir que el teclado se cierre si el usuario no está interactuando
        setTimeout(() => {
          if (!isUserInteracting.current) {
            // El usuario ha dejado de interactuar, permitir que el teclado se cierre
          }
        }, 100);
      }
    } catch (error) {
      console.error("[FileEditScreen] Error parsing WebView message:", error);
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
    navigation.navigate("FileHistory", {
      fileId,
      fileName: editorData?.file.name || "Archivo",
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
          <Ionicons
            name="document-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {editorData.file.name}
            </Text>
            <Text style={styles.versionBadge}>
              Versión {editorData.version}
            </Text>
          </View>
        </View>
        <View style={styles.nonEditableContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.nonEditableTitle}>Archivo no editable</Text>
          <Text style={styles.nonEditableSubtitle}>
            {editorData.content.message ||
              "Este tipo de archivo no se puede editar desde la aplicación móvil."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const screenHeight = Dimensions.get("window").height;

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
          <TouchableOpacity style={styles.backButton} onPress={handleDiscard}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {editorData.file.name}
            </Text>
            <Text style={styles.versionBadge}>
              Versión {editorData.version} de {editorData.total_versions}
            </Text>
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
          <Text style={styles.fileInfoText}>
            Tamaño: {(editorData.file.size / 1024).toFixed(1)} KB
          </Text>
        </View>

        {/* WebView Editor */}
        <TouchableOpacity
          style={styles.webViewContainer}
          activeOpacity={1}
          onPress={handleContainerPress}
        >
          <WebView
            ref={webViewRef}
            key={isExcelView ? `excel-viewer-${(excelDataBase64?.length || 0)}` : 'stable-editor-webview'}
            source={{ html: isExcelView ? excelHtml : editableHtml }}
            style={styles.webView}
            onMessage={onWebViewMessage}
            javaScriptEnabled={true}
            originWhitelist={['*']}
            scalesPageToFit={false}
            startInLoadingState={true}
            keyboardDisplayRequiresUserAction={false}
            hideKeyboardAccessoryView={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{isExcelView ? 'Cargando hoja de cálculo...' : 'Cargando editor...'}</Text>
              </View>
            )}
          />
        </TouchableOpacity>

        {/* Action Buttons */}
        {!isExcelView && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscard}
            >
              <Text style={styles.discardButtonText}>Descartar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!hasChanges || saving) && styles.saveButtonDisabled,
              ]}
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
        )}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: "center",
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
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  nonEditableTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  nonEditableSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
    lineHeight: 24,
  },
  fileInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    minHeight: 400,
    maxHeight: 600,
    margin: theme.spacing.md,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  actionButtons: {
    flexDirection: "row",
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
    fontWeight: "500",
    textAlign: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  headerButtonTextDisabled: {
    color: theme.colors.textTertiary,
  },
});

export default FileEditScreen;
