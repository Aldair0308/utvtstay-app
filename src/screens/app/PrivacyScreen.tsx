import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const PrivacyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Política de Privacidad</Text>
        <Text style={styles.paragraph}>
          Tu privacidad es importante. Esta política explica qué datos recopilamos, cómo los usamos y
          tus derechos sobre la información personal.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Datos que recopilamos</Text>
        <Text style={styles.paragraph}>• Datos de cuenta: nombre, correo electrónico y roles.</Text>
        <Text style={styles.paragraph}>• Archivos y metadatos: nombre, tamaño, versiones y cambios.</Text>
        <Text style={styles.paragraph}>• Eventos de calendario: títulos, descripciones y fechas.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Cómo usamos los datos</Text>
        <Text style={styles.paragraph}>• Para brindar acceso seguro y funcionalidades de la app.</Text>
        <Text style={styles.paragraph}>• Para mejorar la experiencia y asegurar integridad de los contenidos.</Text>
        <Text style={styles.paragraph}>• Para cumplir políticas y requisitos institucionales.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Conservación y seguridad</Text>
        <Text style={styles.paragraph}>• Conservamos datos el tiempo necesario para los fines descritos.</Text>
        <Text style={styles.paragraph}>• Implementamos medidas técnicas y organizativas razonables.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Tus derechos</Text>
        <Text style={styles.paragraph}>• Acceder, rectificar o eliminar tus datos, según normativa aplicable.</Text>
        <Text style={styles.paragraph}>• Contactar soporte para ejercer estos derechos.</Text>
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
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginTop: theme.spacing.md,
    ...theme.components.card,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  sectionHeader: {
    ...theme.typography.styles.h4,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  paragraph: {
    ...theme.typography.styles.body,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
  },
});

export default PrivacyScreen;