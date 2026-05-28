import { useLandPlanner, type LandPlot } from "@/context/LandPlannerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Polygon } from "react-native-svg";

export default function LandScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plots, loadingPlots } = useLandPlanner();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Land</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Design your plot, place plants, track health
          </Text>
        </View>
        <MaterialCommunityIcons name="map-marker-multiple-outline" size={28} color={colors.primary} />
      </View>

      <View style={styles.quickRow}>
        <Pressable
          style={[styles.quickCard, { backgroundColor: colors.primary }]}
          onPress={() => { router.push("/land/plot-creator"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        >
          <MaterialCommunityIcons name="map-plus" size={24} color="#fff" />
          <Text style={styles.quickCardText}>Create Plot</Text>
        </Pressable>
        <Pressable
          style={[styles.quickCard, { backgroundColor: colors.secondary }]}
          onPress={() => { router.push("/land/stores"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        >
          <MaterialCommunityIcons name="store-marker" size={24} color={colors.primary} />
          <Text style={[styles.quickCardTextAlt, { color: colors.primary }]}>Agro Stores</Text>
        </Pressable>
      </View>

      {loadingPlots ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : plots.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="map-marker-radius" size={60} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No land plots yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Create a digital map of your farm. Draw the plot shape, drop plant markers, and track their health over time.
          </Text>
          <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => { router.push("/land/plot-creator"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Create First Plot</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={plots}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.plotCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { router.push({ pathname: "/land/plot-detail", params: { id: String(item.id) } }); Haptics.selectionAsync(); }}
            >
              <View style={[styles.plotPreview, { backgroundColor: colors.secondary }]}>
                <MiniPlotPreview polygon={safeParsePolygon(item.polygon)} colors={colors} />
              </View>
              <View style={styles.plotInfo}>
                <Text style={[styles.plotName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.plotMeta, { color: colors.mutedForeground }]}>
                  {item.area ? `${item.area} ${item.unit}` : "No area set"} · {item.plantsCount ?? 0} plants
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function safeParsePolygon(polygon: string): { x: number; y: number }[] {
  try { return JSON.parse(polygon || "[]") as { x: number; y: number }[]; } catch { return []; }
}

function MiniPlotPreview({ polygon, colors }: { polygon: { x: number; y: number }[]; colors: any }) {
  if (!polygon || polygon.length < 3) return <MaterialCommunityIcons name="map-outline" size={32} color={colors.primary} />;
  const pts = polygon.map((p) => `${p.x * 64},${p.y * 64}`).join(" ");
  return (
    <View style={styles.miniPlotBox}>
      <Svg width="64" height="64" viewBox="0 0 64 64">
        <Polygon points={pts} fill={colors.primary} fillOpacity={0.2} stroke={colors.primary} strokeWidth={1} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  quickCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  quickCardText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  quickCardTextAlt: { fontWeight: "600", fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12, paddingTop: 4 },
  plotCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1 },
  plotPreview: { width: 64, height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  plotInfo: { flex: 1 },
  plotName: { fontSize: 15, fontWeight: "600" },
  plotMeta: { fontSize: 12, marginTop: 2 },
  miniPlotBox: { width: 64, height: 64 },
});
