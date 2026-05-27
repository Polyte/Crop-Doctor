import { DiagnosisCard } from "@/components/DiagnosisCard";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Head from "expo-router/head";
import { useRouter } from "expo-router";
import React from "react";
import {
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
  const { diagnoses, loading } = useDiagnosis();
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
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Farmguard</Text>
        </View>
        <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="shield-check" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* Hero CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.heroCard,
          { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>AI-Powered Diagnosis</Text>
          <Text style={styles.heroTitle}>Scan Your Farm</Text>
          <Text style={styles.heroSub}>
            Take a photo or describe symptoms to identify diseases, pests, and conditions
          </Text>
          <View style={[styles.heroBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.heroBtnText}>Start Diagnosis</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
          </View>
        </View>
        <MaterialCommunityIcons name="leaf-circle" size={100} color="rgba(255,255,255,0.15)" style={styles.heroIcon} />
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Scans</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.severityHigh }]}>{highCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>High Risk</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.severityCritical }]}>{criticalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Critical</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Diagnose</Text>
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/(tabs)/scan", params: { type: "crop" } })}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="sprout" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>Crop Issue</Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
              Diseases, pests, deficiencies
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickCard,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/(tabs)/scan", params: { type: "livestock" } })}
          >
            <View style={[styles.quickIcon, { backgroundColor: "#FFF3E0" }]}>
              <MaterialCommunityIcons name="cow" size={28} color="#E65100" />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>Livestock Issue</Text>
            <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>
              Health conditions, injuries
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Diagnoses */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Diagnoses</Text>
            <Pressable onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
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
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No diagnoses yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap "Start Diagnosis" to scan your first crop or livestock
          </Text>
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
    marginBottom: 20,
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
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
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
  heroBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  heroIcon: {
    position: "absolute",
    right: -10,
    bottom: -10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
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
