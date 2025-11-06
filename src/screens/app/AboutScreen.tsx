import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../theme';

const AboutScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/utvtstay.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>UTVstay</Text>
        <Text style={styles.subtitle}>Gestión integral de archivos y calendario académico</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué es UTVstay?</Text>
        <Text style={styles.paragraph}>
          UTVstay es una aplicación diseñada para apoyar a estudiantes y tutores en la
          organización de documentos y actividades académicas. Permite administrar archivos,
          consultar versiones y visualizar eventos importantes en un calendario unificado.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Funciones principales</Text>
        <Text style={styles.paragraph}>• Gestión de archivos con historial de versiones.</Text>
        <Text style={styles.paragraph}>• Visualización de contenido y edición segura.</Text>
        <Text style={styles.paragraph}>• Calendario de eventos y recordatorios académicos.</Text>
        <Text style={styles.paragraph}>• Perfil de usuario y configuración de cuenta.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soporte</Text>
        <Text style={styles.paragraph}>
          Si necesitas ayuda, consulta el manual de usuario o contáctanos desde el apartado
          de soporte institucional.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  contentContainer: {
    paddingBottom: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.md,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.styles.h2,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.md,
    ...theme.components.card,
  },
  sectionTitle: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    ...theme.typography.styles.body,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
  },
});

export default AboutScreen;