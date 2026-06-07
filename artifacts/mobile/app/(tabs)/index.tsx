import { DiagnosisCard } from "@/components/DiagnosisCard";
import { WeatherWidget } from "@/components/WeatherWidget";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useI18n } from "@/context/LanguageContext";
import { useLocation } from "@/context/LocationContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Head from "expo-router/head";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { diagnoses, loading } = useDiagnosis();
  const { location, detectGPS, gpsLoading } = useLocation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const recent = diagnoses.slice(0, 5);
  const criticalCount = diagnoses.filter(d => d.severity === "critical").length;
  const highCount = diagnoses.filter(d => d.severity === "high").length;
  const totalCount = diagnoses.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : 0 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Head>
        <title>Farmguard — AI Farm Diagnosis & Planting Calendar</title>
        <meta name="description" content="AI-powered crop disease and livestock health diagnosis, moon-aware planting calendar, and local farmers market — all in one app for smallholder farmers." />
      </Head>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{t("welcome.back")}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("app.name")}</Text>
        </View>
        <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="shield-check" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* GPS location bar */}
      <Pressable
        style={[styles.gpsBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={detectGPS}
        disabled={gpsLoading}
      >
        {gpsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.primary} />
        )}
        <Text style={[styles.gpsText, { color: colors.foreground }]} numberOfLines={1}>
          {location ? location.displayName : "Tap to detect your GPS location"}
        </Text>
        {!gpsLoading && (
          <Feather name={location ? "refresh-cw" : "map-pin"} size={14} color={colors.mutedForeground} />
        )}
      </Pressable>

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Hero CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.heroCard,
          { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => router.push("/(tabs)/diagnose")}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>{t("ai.diagnosis")}</Text>
          <Text style={styles.heroTitle}>{t("scan.farm")}</Text>
          <Text style={styles.heroSub}>{t("scan.desc")}</Text>
          <View style={[styles.heroBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.heroBtnText}>{t("start.diagnosis")}</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </View>
        </View>
        <MaterialCommunityIcons name="leaf-circle" size={100} color="rgba(255,255,255,0.15)" style={styles.heroIcon} />
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("total.scans")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.severityHigh }]}>{highCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("high.risk")}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.severityCritical }]}>{criticalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("critical")}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("quick.diagnose")}</Text>
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push({ pathname: "/(tabs)/diagnose", params: { type: "crop" } })}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="sprout" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{t("crop.issue")}</Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{t("crop.desc")}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push({ pathname: "/(tabs)/diagnose", params: { type: "livestock" } })}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#FFF3E0" }]}>
              <MaterialCommunityIcons name="cow" size={28} color="#E65100" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{t("livestock.issue")}</Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{t("livestock.desc")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Farm Tools */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Farm Tools</Text>
        <View style={styles.toolsGrid}>
          <Pressable
            style={[styles.toolCard, { backgroundColor: "#E9C46A18", borderColor: "#E9C46A44" }]}
            onPress={() => router.push("/planting-calendar")}
          >
            <MaterialCommunityIcons name="calendar-star" size={28} color="#C49A00" />
            <Text style={[styles.toolLabel, { color: colors.foreground }]}>Planting Calendar</Text>
            <Text style={[styles.toolSub, { color: colors.mutedForeground }]}>What to plant this month</Text>
          </Pressable>
          <Pressable
            style={[styles.toolCard, { backgroundColor: "#EF233C18", borderColor: "#EF233C44" }]}
            onPress={() => router.push("/community-reports")}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#EF233C" />
            <Text style={[styles.toolLabel, { color: colors.foreground }]}>Outbreak Map</Text>
            <Text style={[styles.toolSub, { color: colors.mutedForeground }]}>Nearby disease reports</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Diagnoses */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t("recent.diagnoses")}</Text>
            <Pressable onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t("see.all")}</Text>
            </Pressable>
          </View>
          {recent.map(d => (
            <DiagnosisCard key={d.id} record={d} />
          ))}
        </View>
      )}

      {diagnoses.length === 0 && !loading && (
        <View style={[styles.emptyState, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="leaf-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("no.diagnoses")}</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("no.diagnoses.desc")}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginTop: 2 },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  gpsText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroContent: { gap: 8 },
  heroLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    maxWidth: "75%",
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  heroBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
  heroIcon: { position: "absolute", right: -10, bottom: -10 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 12 },
  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  quickSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  toolsGrid: { flexDirection: "row", gap: 12 },
  toolCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    alignItems: "flex-start",
  },
  toolLabel: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  toolSub: { fontSize: 12, lineHeight: 16 },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
