import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Severity = "low" | "medium" | "high" | "critical";

interface Props {
  severity: Severity;
  size?: "sm" | "md";
}

const LABELS: Record<Severity, string> = {
  low: "Low Risk",
  medium: "Moderate",
  high: "High Risk",
  critical: "Critical",
};

export function SeverityBadge({ severity, size = "md" }: Props) {
  const colors = useColors();

  const bgColor = {
    low: colors.severityLow,
    medium: colors.severityMedium,
    high: colors.severityHigh,
    critical: colors.severityCritical,
  }[severity];

  const textColor = severity === "medium" ? colors.accentForeground : "#FFFFFF";

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, size === "sm" && styles.badgeSm]}>
      <Text style={[styles.text, { color: textColor }, size === "sm" && styles.textSm]}>
        {LABELS[severity]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 11,
  },
});
