import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const TermsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
        <Text style={styles.paragraph}>
          Al utilizar UTVstay, aceptas los siguientes términos y condiciones. Te sugerimos leerlos
          cuidadosamente para comprender tus derechos y responsabilidades.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Uso de la aplicación</Text>
        <Text style={styles.paragraph}>• Debes proporcionar información veraz y mantener tu cuenta segura.</Text>
        <Text style={styles.paragraph}>• No está permitido el uso indebido, acceso no autorizado, ni distribución de malware.</Text>
        <Text style={styles.paragraph}>• El uso de la app debe alinearse con las políticas institucionales vigentes.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Propiedad y contenido</Text>
        <Text style={styles.paragraph}>• Conservas los derechos sobre tus archivos, sujeto a normativas institucionales.</Text>
        <Text style={styles.paragraph}>• Debes respetar derechos de autor y confidencialidad en los documentos.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Limitación de responsabilidad</Text>
        <Text style={styles.paragraph}>
          • La aplicación se ofrece “tal cual”. No garantizamos disponibilidad continua ni ausencia total de errores.
        </Text>
        <Text style={styles.paragraph}>
          • No nos hacemos responsables de pérdidas derivadas de uso inadecuado o incumplimiento de políticas.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Modificaciones</Text>
        <Text style={styles.paragraph}>
          • Los términos pueden actualizarse. Las modificaciones entrarán en vigor una vez publicadas en la app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Contacto</Text>
        <Text style={styles.paragraph}>
          • Para dudas o soporte, utiliza los canales institucionales indicados en la aplicación.
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

export default TermsScreen;