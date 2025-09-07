import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList, File } from '../../interfaces';
import { filesService } from '../../services/files';
import { theme } from '../../theme';
import LoadingScreen from '../../components/common/LoadingScreen';

type FileEditNavigationProp = StackNavigationProp<AppStackParamList, 'FileEdit'>;
type FileEditRouteProp = RouteProp<AppStackParamList, 'FileEdit'>;

const FileEditScreen: React.FC = () => {
  const navigation = useNavigation<FileEditNavigationProp>();
  const route = useRoute<FileEditRouteProp>();
  const { fileId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadFileForEdit();
  }, [fileId]);

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

  const loadFileForEdit = async () => {
    try {
      const fileData = await filesService.getFileById(fileId);
      setFile(fileData);
      setFileName(fileData.name);
      setFileDescription(fileData.description || '');
      
      // En una implementación real, aquí cargarías el contenido actual del archivo
      setFileContent('Contenido actual del archivo para editar...');
    } catch (error) {
      console.error('Error loading file for edit:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo para editar');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!file) return;

    if (!fileName.trim()) {
      Alert.alert('Error', 'El nombre del archivo es requerido');
      return;
    }

    setSaving(true);
    try {
      // Actualizar metadatos del archivo
      await filesService.updateFile(file.id, {
        name: fileName.trim(),
        description: fileDescription.trim(),
      });

      // Actualizar contenido del archivo
      await filesService.updateFileContent(file.id, fileContent);

      Alert.alert('Éxito', 'Archivo guardado correctamente');
      setHasChanges(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving file:', error);
      Alert.alert('Error', 'No se pudo guardar el archivo');
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

  const handleNameChange = (text: string) => {
    setFileName(text);
    setHasChanges(true);
  };

  const handleDescriptionChange = (text: string) => {
    setFileDescription(text);
    setHasChanges(true);
  };

  const handleContentChange = (text: string) => {
    setFileContent(text);
    setHasChanges(true);
  };

  if (loading) {
    return <LoadingScreen message="Cargando archivo..." />;
  }

  if (!file) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Archivo no encontrado</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* File Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.sectionTitle}>Información del Archivo</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del Archivo</Text>
            <TextInput
              style={styles.input}
              value={fileName}
              onChangeText={handleNameChange}
              placeholder="Nombre del archivo"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={fileDescription}
              onChangeText={handleDescriptionChange}
              placeholder="Descripción del archivo"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* File Content Editor */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Contenido del Archivo</Text>
          
          <View style={styles.editorContainer}>
            <TextInput
              style={styles.editor}
              value={fileContent}
              onChangeText={handleContentChange}
              placeholder="Contenido del archivo..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* File Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de Archivo:</Text>
            <Text style={styles.infoValue}>{file.mimeType}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión Actual:</Text>
            <Text style={styles.infoValue}>{file.version}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Modificación:</Text>
            <Text style={styles.infoValue}>
              {new Date(file.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.discardButton}
            onPress={handleDiscard}
          >
            <Text style={styles.discardButtonText}>Descartar Cambios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            <Text style={[
              styles.saveButtonText,
              (!hasChanges || saving) && styles.saveButtonTextDisabled
            ]}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Changes Indicator */}
      {hasChanges && (
        <View style={styles.changesIndicator}>
          <Text style={styles.changesText}>Tienes cambios sin guardar</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  scrollContainer: {
    flex: 1,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerButtonTextDisabled: {
    color: theme.colors.textTertiary,
  },
  metadataSection: {
    margin: theme.spacing.screenPadding,
    ...theme.components.card,
  },
  contentSection: {
    margin: theme.spacing.screenPadding,
    marginTop: 0,
    ...theme.components.card,
  },
  infoSection: {
    margin: theme.spacing.screenPadding,
    marginTop: 0,
    ...theme.components.card,
  },
  actionsSection: {
    margin: theme.spacing.screenPadding,
    marginTop: 0,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.styles.label,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
  },
  textArea: {
    height: 80,
    paddingTop: theme.spacing.inputPadding,
  },
  editorContainer: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.dimensions.borderRadius.md,
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.border,
    minHeight: 300,
  },
  editor: {
    ...theme.typography.styles.body,
    fontFamily: 'monospace',
    padding: theme.spacing.md,
    minHeight: 300,
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: theme.dimensions.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    ...theme.typography.styles.body,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  discardButton: {
    ...theme.components.button.secondary,
  },
  discardButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    ...theme.components.button.primary,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textTertiary,
  },
  saveButtonText: {
    ...theme.typography.styles.button,
    color: theme.colors.textLight,
  },
  saveButtonTextDisabled: {
    color: theme.colors.textSecondary,
  },
  changesIndicator: {
    backgroundColor: theme.colors.warning,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  changesText: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.typography.styles.h3,
    color: theme.colors.textSecondary,
  },
});

export default FileEditScreen;