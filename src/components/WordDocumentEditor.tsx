import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// Tipos para el manejo del editor Word
export type WordEditorHandle = {
  getDocumentContent: () => Promise<string>;
  saveDocument: () => Promise<{ content: string; format: 'docx' | 'html' }>;
  loadDocument: (content: string, format: 'docx' | 'html') => Promise<void>;
};

type Props = {
  initialContent?: string;
  initialFormat?: 'docx' | 'html';
  onContentChange?: (content: string) => void;
  onSave?: (content: string, format: 'docx' | 'html') => void;
  readOnly?: boolean;
};

const WordDocumentEditor = forwardRef<WordEditorHandle, Props>(function WordDocumentEditor(
  { initialContent, initialFormat = 'html', onContentChange, onSave, readOnly = false },
  ref
) {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  // HTML template para el editor Word profesional
  const editorHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor de Documentos Word</title>
    
    <!-- Syncfusion Document Editor CSS -->
    <link href="https://cdn.syncfusion.com/ej2/31.2.4/material.css" rel="stylesheet">
    
    <!-- Syncfusion Document Editor Scripts -->
    <script src="https://cdn.syncfusion.com/ej2/31.2.4/dist/ej2.min.js"></script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        
        #container {
            height: 100vh;
            width: 100vw;
        }
        
        .editor-toolbar {
            background: #fff;
            border-bottom: 1px solid #e0e0e0;
            padding: 10px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .editor-btn {
            padding: 8px 12px;
            background: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .editor-btn:hover {
            background: #1565c0;
        }
        
        .editor-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="editor-toolbar">
        <button class="editor-btn" onclick="formatText('bold')" title="Negrita">B</button>
        <button class="editor-btn" onclick="formatText('italic')" title="Itálica">I</button>
        <button class="editor-btn" onclick="formatText('underline')" title="Subrayado">U</button>
        <button class="editor-btn" onclick="insertImage()" title="Insertar imagen">📷</button>
        <button class="editor-btn" onclick="insertTable()" title="Insertar tabla">📊</button>
        <button class="editor-btn" onclick="saveDocument()" title="Guardar">💾</button>
    </div>
    
    <div id="container"></div>

    <script>
        let documentEditor;
        let isDocumentLoaded = false;

        // Inicializar el editor cuando la página cargue
        window.addEventListener('load', function() {
            try {
                // Crear instancia del Document Editor
                documentEditor = new ej.documenteditor.DocumentEditor({ 
                    enableSelection: true,
                    enableEditor: true,
                    enableEditorHistory: true,
                    enableSfdtExport: true,
                    enableWordExport: true,
                    enableOptionsPane: true,
                    enableContextMenu: true
                });
                
                // Adjuntar el editor al contenedor
                documentEditor.appendTo('#container');
                
                // Notificar a React Native que el editor está listo
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'editorReady',
                    status: 'success'
                }));
                
            } catch (error) {
                console.error('Error inicializando editor:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'editorError',
                    error: error.message
                }));
            }
        });

        // Función para cargar contenido en el editor
        window.loadContent = function(content, format) {
            try {
                if (format === 'docx') {
                    // Para DOCX, necesitaríamos un servicio backend
                    console.warn('La carga directa de DOCX requiere servicio backend');
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'loadError',
                        message: 'La carga de DOCX requiere configuración adicional'
                    }));
                } else {
                    // Para HTML, podemos cargar directamente
                    documentEditor.documentEditor.open(JSON.stringify({
                        content: content || '<p>Nuevo documento</p>'
                    }));
                    isDocumentLoaded = true;
                }
            } catch (error) {
                console.error('Error cargando contenido:', error);
            }
        };

        // Función para obtener el contenido del documento
        window.getContent = function() {
            try {
                if (!isDocumentLoaded) return '';
                
                // Exportar como HTML (simplificado para demo)
                const content = documentEditor.documentEditor.serialize();
                return content;
            } catch (error) {
                console.error('Error obteniendo contenido:', error);
                return '';
            }
        };

        // Función para guardar el documento
        window.saveDocument = function() {
            try {
                const content = window.getContent();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'documentSave',
                    content: content,
                    format: 'html'
                }));
            } catch (error) {
                console.error('Error guardando documento:', error);
            }
        };

        // Funciones de formato básicas
        window.formatText = function(formatType) {
            try {
                switch(formatType) {
                    case 'bold':
                        documentEditor.documentEditor.editor.toggleBold();
                        break;
                    case 'italic':
                        documentEditor.documentEditor.editor.toggleItalic();
                        break;
                    case 'underline':
                        documentEditor.documentEditor.editor.toggleUnderline();
                        break;
                }
            } catch (error) {
                console.error('Error aplicando formato:', error);
            }
        };

        // Manejar mensajes desde React Native
        document.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'loadContent':
                        window.loadContent(data.content, data.format);
                        break;
                    case 'getContent':
                        const content = window.getContent();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'contentResponse',
                            content: content
                        }));
                        break;
                }
            } catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        });

        // Escuchar cambios en el contenido
        setInterval(() => {
            if (isDocumentLoaded) {
                const content = window.getContent();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'contentChange',
                    content: content
                }));
            }
        }, 1000);

    </script>
</body>
</html>`;

  // Métodos expuestos al componente padre
  useImperativeHandle(ref, () => ({
    getDocumentContent: async () => {
      return new Promise((resolve) => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: 'getContent' })
          );
          
          // Escuchar la respuesta
          const listener = (event: any) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'contentResponse') {
                resolve(data.content);
              }
            } catch (error) {
              console.error('Error obteniendo contenido:', error);
              resolve('');
            }
          };
          
          // Temporalmente agregar listener
          // En una implementación real, se usaría un mecanismo más robusto
          setTimeout(() => resolve(''), 1000);
        } else {
          resolve('');
        }
      });
    },
    
    saveDocument: async () => {
      return new Promise((resolve) => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: 'saveDocument' })
          );
          resolve({ content: '', format: 'html' });
        } else {
          resolve({ content: '', format: 'html' });
        }
      });
    },
    
    loadDocument: async (content: string, format: 'docx' | 'html') => {
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({ 
            type: 'loadContent', 
            content: content,
            format: format 
          })
        );
      }
    }
  }));

  // Manejar mensajes desde el WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'editorReady':
          setIsReady(true);
          // Cargar contenido inicial si existe
          if (initialContent && webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({ 
                type: 'loadContent', 
                content: initialContent,
                format: initialFormat 
              })
            );
          }
          break;
          
        case 'contentChange':
          if (onContentChange && data.content) {
            onContentChange(data.content);
          }
          break;
          
        case 'documentSave':
          if (onSave && data.content) {
            onSave(data.content, data.format || 'html');
          }
          break;
          
        case 'editorError':
          console.error('Error en el editor:', data.error);
          break;
      }
    } catch (error) {
      console.error('Error procesando mensaje del WebView:', error);
    };
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: editorHTML }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onLoadEnd={() => console.log('WebView cargado completamente')}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

export default WordDocumentEditor;