import React from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from "../theme";

interface Props {
  base64Html: string;
  style?: any;
  tableCss?: string;
}

export default function ExcelPreviewWebView({ base64Html, style, tableCss }: Props) {
  const uri = `data:text/html;charset=utf-8;base64,${base64Html || ''}`;

  const defaultCss = [
    'html,body{margin:0;padding:8px;font-family:system-ui,Segoe UI,Arial}',
    'table{border-collapse:collapse;width:100%}',
    'th,td{border:1px solid #ddd;padding:4px;font-size:12px}',
    'thead th{position:sticky;top:0;background:#f7f7f7;z-index:1}'
  ].join(';');

  const injected = `(function(){
    try {
      var style = document.createElement('style');
      style.innerHTML = ${JSON.stringify(tableCss || defaultCss)};
      document.head.appendChild(style);
    } catch(e) { console.log('style injection error', e); }
  })(); true;`;

  if (!base64Html) {
    return (
      <View style={{ padding: theme.spacing.md }}>
        <Text style={{ color: theme.colors.textSecondary }}>No hay contenido de vista previa.</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}> 
      <WebView
        originWhitelist={['*']}
        source={{ uri }}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        startInLoadingState
        injectedJavaScript={injected}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.md }}>
            <Text style={{ color: theme.colors.textSecondary }}>Cargando vista previa...</Text>
          </View>
        )}
      />
    </View>
  );
}