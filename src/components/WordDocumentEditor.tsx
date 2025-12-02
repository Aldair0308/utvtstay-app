import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, StyleSheet, Platform } from "react-native";
import { WebView } from "react-native-webview";

// Tipos para el manejo del editor Word
export type WordEditorHandle = {
  getDocumentContent: () => Promise<string>;
  saveDocument: () => Promise<{ content: string; format: "docx" | "html" }>;
  loadDocument: (content: string, format: "docx" | "html") => Promise<void>;
};

type Props = {
  initialContent?: string;
  initialFormat?: "docx" | "html";
  onContentChange?: (content: string) => void;
  onSave?: (content: string, format: "docx" | "html") => void;
  readOnly?: boolean;
};

const WordDocumentEditor = forwardRef<WordEditorHandle, Props>(
  function WordDocumentEditor(
    {
      initialContent,
      initialFormat = "html",
      onContentChange,
      onSave,
      readOnly = false,
    },
    ref
  ) {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);

    const editorHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Editor</title>
  <script src="https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js"></script>
  <style>
    html, body { height:100%; width:100%; margin:0; padding:0; background:#fff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; overflow:hidden }
    #editor { height: 100vh; }
    /* Ocultar notificaciones/advertencias de CKEditor */
    .cke_notifications_area, .cke_notification { display: none !important; }
    /* Asegurar que el iframe ocupe todo el alto disponible */
    .cke, .cke_inner, .cke_contents { height: 100% !important; }
  </style>
</head>
<body>
  <textarea id="editor"></textarea>
  <script>
    var editorInstance = null;
    var isLoadingContent = false;
    function setupEditor() {
      editorInstance = CKEDITOR.replace('editor', {
        removePlugins: 'cloudservices,easyimage,notification',
        allowedContent: true,
        contentsCss: 'body { padding: 0 2px 50px 2px !important; margin: 0 !important; font-size: 11px !important; } * { font-size: 11px !important; line-height: 1.4 !important; } div[class*="WordSection"], p { margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; width: 100% !important; }'
      });
      editorInstance.on('instanceReady', function(){
        try { 
          editorInstance.document.getBody().setStyle('padding-bottom', '50px');
          var h = Math.max(window.innerHeight, 320);
          editorInstance.resize(null, h);
        } catch(e) {}
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'editorReady' }));
      });
      window.addEventListener('resize', function(){
        try { 
          var h = Math.max(window.innerHeight, 320);
          editorInstance.resize(null, h);
        } catch(e) {}
      });
      var debounce;
      editorInstance.on('change', function(){
        if (isLoadingContent) return;
        try { if (!editorInstance.checkDirty()) return; } catch(e) {}
        clearTimeout(debounce);
        debounce = setTimeout(function(){
          var html = editorInstance.getData();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'contentChange', content: html }));
        }, 250);
      });
    }
    function loadContent(content, format) {
      if (!editorInstance) return;
      try {
        isLoadingContent = true;
        editorInstance.setData(content || '<p></p>', function(){
          try { editorInstance.resetDirty(); } catch(e) {}
          isLoadingContent = false;
        });
      } catch(e) { isLoadingContent = false; }
    }
    function getContent() {
      try { return editorInstance ? editorInstance.getData() : ''; } catch(e) { return ''; }
    }
    (function(){ setupEditor(); })();
    function handleMessage(raw) {
      try {
        var data = JSON.parse(raw);
        if (data.type === 'loadContent') { loadContent(data.content, data.format); }
        else if (data.type === 'getContent') {
          var html = getContent();
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'contentResponse', content: html }));
        }
      } catch(e) {}
    }
    document.addEventListener('message', function(e){ handleMessage(e.data); });
    window.addEventListener('message', function(e){ handleMessage(e.data); });
  </script>
</body>
</html>`;

    // Métodos expuestos al componente padre
    useImperativeHandle(ref, () => ({
      getDocumentContent: async () => {
        return new Promise((resolve) => {
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({ type: "getContent" })
            );

            // Escuchar la respuesta
            const listener = (event: any) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "contentResponse") {
                  resolve(data.content);
                }
              } catch (error) {
                console.error("Error obteniendo contenido:", error);
                resolve("");
              }
            };

            // Temporalmente agregar listener
            // En una implementación real, se usaría un mecanismo más robusto
            setTimeout(() => resolve(""), 1000);
          } else {
            resolve("");
          }
        });
      },

      saveDocument: async () => {
        return new Promise((resolve) => {
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({ type: "saveDocument" })
            );
            resolve({ content: "", format: "html" });
          } else {
            resolve({ content: "", format: "html" });
          }
        });
      },

      loadDocument: async (content: string, format: "docx" | "html") => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "loadContent",
              content: content,
              format: format,
            })
          );
        }
      },
    }));

    // Manejar mensajes desde el WebView
    const handleWebViewMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "editorReady":
            setIsReady(true);
            // Cargar contenido inicial si existe
            if (initialContent && webViewRef.current) {
              webViewRef.current.postMessage(
                JSON.stringify({
                  type: "loadContent",
                  content: initialContent,
                  format: initialFormat,
                })
              );
            }
            break;

          case "contentChange":
            if (onContentChange && data.content) {
              onContentChange(data.content);
            }
            break;

          case "documentSave":
            if (onSave && data.content) {
              onSave(data.content, data.format || "html");
            }
            break;

          case "editorError":
            console.error("Error en el editor:", data.error);
            break;
        }
      } catch (error) {
        console.error("Error procesando mensaje del WebView:", error);
      }
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
            console.error("WebView error:", nativeEvent);
          }}
          onLoadEnd={() => console.log("WebView cargado completamente")}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});

export default WordDocumentEditor;
