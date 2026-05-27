import { MoonPhaseIcon } from "@/components/MoonPhaseIcon";
import { GrowPhase, useGrowPlan } from "@/context/GrowPlanContext";
import { useColors } from "@/hooks/useColors";
import { getMoonPhase, MOON_GARDENING_GUIDE } from "@/utils/moonPhase";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PHASE_COLORS = [
  "#2D6A4F", "#40916C", "#52B788", "#74C69D",
  "#B7E4C7", "#E9C46A", "#F4A261",
];

function PhaseCard({ phase, index, startDate }: { phase: GrowPhase; index: number; startDate: Date }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(index === 0);
  const color = PHASE_COLORS[index % PHASE_COLORS.length];

  const phaseStart = new Date(startDate);
  phaseStart.setDate(phaseStart.getDate() + phase.startDay);
  const phaseEnd = new Date(startDate);
  phaseEnd.setDate(phaseEnd.getDate() + phase.endDay);

  const duration = phase.endDay - phase.startDay;

  return (
    <Pressable
      style={[styles.phaseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => { setExpanded(e => !e); Haptics.selectionAsync(); }}
    >
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseNumber, { backgroundColor: color }]}>
          <Text style={styles.phaseNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.phaseHeaderInfo}>
          <Text style={[styles.phaseName, { color: colors.foreground }]}>{phase.name}</Text>
          <Text style={[styles.phaseDates, { color: colors.mutedForeground }]}>
            Day {phase.startDay}–{phase.endDay} · {duration} days ·{" "}
            {phaseStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" – "}
            {phaseEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </View>

      {expanded && (
        <View style={styles.phaseBody}>
          {/* Moon advice */}
          <View style={[styles.moonAdvice, { backgroundColor: "#1B2838" }]}>
            <Text style={styles.moonAdviceEmoji}>🌙</Text>
            <View style={styles.moonAdviceContent}>
              <Text style={styles.moonAdviceTitle}>Moon Advice</Text>
              <Text style={styles.moonAdviceText}>{phase.moonAdvice}</Text>
              {phase.bestMoonPhases?.length > 0 && (
                <View style={styles.bestMoonRow}>
                  {phase.bestMoonPhases.map((mp, i) => (
                    <View key={i} style={styles.moonPhasePill}>
                      <Text style={styles.moonPhasePillText}>{mp}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Activities */}
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: colors.foreground }]}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={14} color={color} /> Activities
            </Text>
            {phase.activities.map((a, i) => (
              <View key={i} style={styles.listRow}>
                <View style={[styles.listDot, { backgroundColor: color }]} />
                <Text style={[styles.listText, { color: colors.foreground }]}>{a}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          {phase.tips?.length > 0 && (
            <View style={styles.listSection}>
              <Text style={[styles.listTitle, { color: colors.foreground }]}>
                <MaterialCommunityIcons name="lightbulb-outline" size={14} color={colors.accent} /> Tips
              </Text>
              {phase.tips.map((t, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.listDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.listText, { color: colors.foreground }]}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function GrowPlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, deletePlan } = useGrowPlan();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timeline" | "moon" | "tips">("timeline");

  const plan = useMemo(() => plans.find(p => p.id === id), [plans, id]);

  if (!plan) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Plan not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_500Medium", marginTop: 8 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const startDate = new Date(plan.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.totalDays);
  const todayMoon = getMoonPhase();
  const moonGuideEntries = Object.entries(plan.moonGuide ?? {});

  function handleDelete() {
    Alert.alert("Delete Plan", "Remove this grow plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deletePlan(plan!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: plan.cropName,
          headerRight: () => (
            <Pressable onPress={handleDelete} style={{ padding: 8 }}>
              <Feather name="trash-2" size={20} color={colors.destructive} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40, paddingTop: Platform.OS === "web" ? 20 : 0 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>{plan.season} · {plan.hemisphere} hemisphere</Text>
              <Text style={styles.heroCrop}>{plan.cropName}</Text>
              <Text style={styles.heroLocation}>{plan.location}</Text>
            </View>
            <MaterialCommunityIcons name="sprout" size={56} color="rgba(255,255,255,0.2)" />
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{plan.totalDays}</Text>
              <Text style={styles.heroStatLabel}>Total Days</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{plan.phases.length}</Text>
              <Text style={styles.heroStatLabel}>Phases</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>
                {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
              <Text style={styles.heroStatLabel}>Est. Harvest</Text>
            </View>
          </View>
        </View>

        {/* Today's moon */}
        <View style={[styles.todayMoon, { backgroundColor: "#1B2838", borderColor: "#2D3F55" }]}>
          <Text style={styles.todayMoonLabel}>Today's Moon</Text>
          <View style={styles.todayMoonRow}>
            <Text style={{ fontSize: 28 }}>{todayMoon.emoji}</Text>
            <View>
              <Text style={styles.todayMoonName}>{todayMoon.name}</Text>
              <Text style={styles.todayMoonAdvice}>{todayMoon.gardeningAdvice}</Text>
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {(["timeline", "moon", "tips"] as const).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.card }]}
              onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
                {tab === "timeline" ? "Timeline" : tab === "moon" ? "Moon Guide" : "Tips"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Timeline tab */}
        {activeTab === "timeline" && (
          <View style={styles.section}>
            {plan.phases.map((phase, i) => (
              <PhaseCard key={i} phase={phase} index={i} startDate={startDate} />
            ))}
          </View>
        )}

        {/* Moon guide tab */}
        {activeTab === "moon" && (
          <View style={styles.section}>
            <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.infoBoxText, { color: colors.foreground }]}>
                Biodynamic farming uses moon phases to time planting, watering, harvesting, and soil work. Below is your personalised moon guide for {plan.cropName}.
              </Text>
            </View>
            {moonGuideEntries.map(([phase, advice]) => {
              const guide = MOON_GARDENING_GUIDE[phase];
              return (
                <View key={phase} style={[styles.moonGuideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.moonGuideHeader}>
                    <Text style={{ fontSize: 22 }}>
                      {phase === "New Moon" ? "🌑" : phase === "Waxing Crescent" ? "🌒" : phase === "First Quarter" ? "🌓" : phase === "Waxing Gibbous" ? "🌔" : phase === "Full Moon" ? "🌕" : phase === "Waning Gibbous" ? "🌖" : phase === "Last Quarter" ? "🌗" : "🌘"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moonGuidePhaseName, { color: colors.foreground }]}>{phase}</Text>
                      {guide && <Text style={[styles.moonGuideTitle, { color: colors.primary }]}>{guide.title}</Text>}
                    </View>
                  </View>
                  <Text style={[styles.moonGuideAdvice, { color: colors.foreground }]}>{advice}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Tips tab */}
        {activeTab === "tips" && (
          <View style={styles.section}>
            {plan.generalTips.map((tip, i) => (
              <View key={i} style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tipNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tipNumberText}>{i + 1}</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },

  heroCard: { borderRadius: 18, padding: 20, gap: 16 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
  heroCrop: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFF", marginTop: 4 },
  heroLocation: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  heroStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)" },
  heroDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  todayMoon: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  todayMoonLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.8 },
  todayMoonRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  todayMoonName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  todayMoonAdvice: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", lineHeight: 18, marginTop: 4, flex: 1 },

  tabBar: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 3, gap: 2, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  section: { gap: 10, marginTop: 4 },

  phaseCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  phaseNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  phaseNumberText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFF" },
  phaseHeaderInfo: { flex: 1 },
  phaseName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  phaseDates: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  phaseBody: { marginTop: 14, gap: 12 },
  moonAdvice: { borderRadius: 10, padding: 12, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  moonAdviceEmoji: { fontSize: 20, marginTop: 2 },
  moonAdviceContent: { flex: 1, gap: 6 },
  moonAdviceTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5 },
  moonAdviceText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 18 },
  bestMoonRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  moonPhasePill: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  moonPhasePillText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },

  listSection: { gap: 8 },
  listTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  listDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  listText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  infoBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  infoBoxText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  moonGuideCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  moonGuideHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  moonGuidePhaseName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  moonGuideTitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 1 },
  moonGuideAdvice: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  tipCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  tipNumber: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 1 },
  tipNumberText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#FFF" },
  tipText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
