import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getMoonPhase } from "@/utils/moonPhase";

interface Props {
  date?: Date;
  size?: number;
  showLabel?: boolean;
}

export function MoonPhaseIcon({ date, size = 28, showLabel = false }: Props) {
  const colors = useColors();
  const phase = getMoonPhase(date ?? new Date());

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: size }}>{phase.emoji}</Text>
      {showLabel && (
        <Text style={[styles.label, { color: colors.mutedForeground, fontSize: size * 0.38 }]}>
          {phase.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 2 },
  label: { fontFamily: "Inter_500Medium", textAlign: "center" },
});
