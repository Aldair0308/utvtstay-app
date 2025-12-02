import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

type Props = {
  value: number; // 0-100
  height?: number;
  showLabel?: boolean;
};

const ProgressBar: React.FC<Props> = ({ value, height = 14, showLabel = true }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));

  return (
    <View style={styles.wrapper}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>Progreso</Text>
          <Text style={styles.value}>{pct}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}> 
        <View style={[styles.fill, { width: `${pct}%`, height }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...theme.components.card,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  label: {
    ...theme.typography.styles.body,
    color: theme.colors.text,
    fontWeight: "600",
  },
  value: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  track: {
    width: "100%",
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.dimensions.borderRadius.full,
    overflow: "hidden",
    borderWidth: theme.dimensions.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  fill: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.dimensions.borderRadius.full,
  },
});

export default ProgressBar;

