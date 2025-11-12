import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import WordDocumentEditor, { WordEditorHandle } from './WordDocumentEditor';
import { getFileContent, updateFileContentWithMime } from '../services/files';
import { File as FileType } from '../interfaces/File';
import LoadingScreen from './common/LoadingScreen';

// Definir tipos para la navegación
type RootStackParamList = {
  FileEditScreenWord: { file: FileType };
};

type FileEditScreenWordRouteProp = RouteProp<RootStackParamList, 'FileEditScreenWord'>;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FileEditScreenWord'>;
};

const FileEditScreenWord: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<FileEditScreenWordRouteProp>();
  const { file } = route.params;
  
  const editorRef = useRef<WordEditorHandle>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documentContent, setDocumentContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar contenido del documento al montar el componente
  useEffect(() => {
    loadFileContent();
  }, []);

  const loadFileContent = async () => {
    try {
      setIsLoading(true);
      const content = await getFileContent(file.id);
      
      if (content && typeof content === 'string') {
        setDocumentContent(content);
      } else {
        // Contenido vacío para nuevo documento
        setDocumentContent('<p>Nuevo documento Word</p>');
      }
    } catch (error) {
      console.error('Error cargando contenido del archivo:', error);
      Alert.alert('Error', 'No se pudo cargar el contenido del documento');
      setDocumentContent('<p>Nuevo documento Word</p>');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en el contenido
  const handleContentChange = (content: string) => {
    setHasChanges(true);
    // Aquí puedes implementar autoguardado si es necesario
  };

  // Guardar documento
  const handleSave = async (content: string, format: 'docx' | 'html') => {
    try {
      setIsLoading(true);
      
      // Usar el tipo MIME apropiado según el formato
      const mimeType = format === 'docx' ? 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
        'text/html';
      
      await updateFileContentWithMime(file.id, content, mimeType);
      
      setHasChanges(false);
      Alert.alert('Éxito', 'Documento guardado correctamente');
    } catch (error) {
      console.error('Error guardando documento:', error);
      Alert.alert('Error', 'No se pudo guardar el documento');
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar botones de navegación
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {hasChanges && (
            <ActivityIndicator 
              size="small" 
              color="#007AFF" 
              style={styles.saveIndicator}
            />
          )}
        </View>
      ),
    });
  }, [navigation, hasChanges]);

  if (isLoading) {
    return <LoadingScreen message="Cargando editor de Word..." />;
  }

  // Mostrar mensaje y cuerpo de la respuesta si el contenido está vacío
  if (!documentContent || documentContent.trim().length === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#444', fontSize: 16, marginTop: 32, textAlign: 'center' }}>
          No se pudo cargar el archivo
        </Text>
        <Text style={{ marginTop: 12, color: '#888', fontSize: 12, textAlign: 'center' }}>
          Respuesta recibida: {JSON.stringify(documentContent).slice(0, 1000)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WordDocumentEditor
        ref={editorRef}
        initialContent={documentContent}
        initialFormat="html"
        onContentChange={handleContentChange}
        onSave={handleSave}
        readOnly={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  saveIndicator: {
    marginRight: 8,
  },
});

export default FileEditScreenWord;