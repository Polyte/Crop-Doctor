import { DiagnosisRecord } from "@/context/DiagnosisContext";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  record: DiagnosisRecord;
  isOffline?: boolean;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DiagnosisCard({ record, isOffline }: Props) {
  const colors = useColors();
  const { t } = useI18n();
  const router = useRouter();

  const subjectLabel = record.subjectType === "crop"
    ? record.cropType || "Crop"
    : record.livestockType || "Livestock";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={() => router.push({ pathname: "/result/[id]", params: { id: record.id } })}
    >
      <View style={styles.row}>
        {record.imageUri ? (
          <Image source={{ uri: record.imageUri }} style={styles.thumb} />
        ) : (
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            {record.subjectType === "crop" ? (
              <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="cow" size={24} color={colors.primary} />
            )}
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.condition, { color: colors.foreground }]} numberOfLines={1}>
              {record.condition}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {isOffline && (
                <View style={[styles.offlineBadge, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name="cloud-off-outline" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>{t("offline.saved")}</Text>
                </View>
              )}
              <Text style={[styles.time, { color: colors.mutedForeground }]}>
                {formatTime(record.timestamp)}
              </Text>
            </View>
          </View>
          <Text style={[styles.subject, { color: colors.mutedForeground }]}>
            {subjectLabel}
          </Text>
          <View style={styles.bottomRow}>
            <SeverityBadge severity={record.severity} size="sm" />
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  condition: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  subject: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  bottomRow: {
    marginTop: 4,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
