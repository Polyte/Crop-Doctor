import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/context/LocationContext";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface CropEntry {
  id: number;
  name: string;
  category: string;
  variety: string | null;
  maturityDays: number | null;
  spacing: string | null;
  waterNeeds: string | null;
  seasons: string;
  regions: string;
  description: string | null;
}

interface CalendarData {
  month: number;
  monthName: string;
  region: string;
  crops: CropEntry[];
  advice: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Cereals: "#E9C46A",
  Vegetables: "#52B788",
  Legumes: "#90BE6D",
  Fruits: "#F4A261",
  Roots: "#BC8F5F",
  Cash: "#AEE6F0",
  Oilseeds: "#F9C74F",
  Other: "#B5B5B5",
};

const WATER_ICONS: Record<string, string> = {
  low: "water-outline",
  medium: "water-percent",
  high: "waves",
};

export default function PlantingCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location } = useLocation();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCalendar = useCallback(async (m: number) => {
    setLoading(true);
    try {
      const region = location?.country ?? location?.region ?? "";
      const res = await fetch(`${API_BASE}/crops/calendar?month=${m}&region=${encodeURIComponent(region)}`);
      if (res.ok) setData(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { fetchCalendar(month); }, [month, fetchCalendar]);

  const prevMonth = () => setMonth(m => m === 1 ? 12 : m - 1);
  const nextMonth = () => setMonth(m => m === 12 ? 1 : m + 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Planting Calendar</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Month picker */}
      <View style={[styles.monthRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={prevMonth} style={styles.iconBtn}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.monthCenter}>
          <Text style={[styles.monthName, { color: colors.foreground }]}>{MONTH_NAMES[month - 1]}</Text>
          <Text style={[styles.monthRegion, { color: colors.mutedForeground }]}>{data?.region ?? "East Africa"}</Text>
        </View>
        <Pressable onPress={nextMonth} style={styles.iconBtn}>
          <Feather name="chevron-right" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : !data || data.crops.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="sprout-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No crops in season this month.</Text>
        </View>
      ) : (
        <FlatList
          data={data.crops}
          keyExtractor={c => String(c.id)}
          ListHeaderComponent={
            <View style={[styles.adviceCard, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
              <Text style={[styles.adviceText, { color: colors.foreground }]}>{data.advice}</Text>
            </View>
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          renderItem={({ item }) => {
            const catColor = CATEGORY_COLORS[item.category] ?? "#B5B5B5";
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.catDot, { backgroundColor: catColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cropName, { color: colors.foreground }]}>{item.name}</Text>
                    {item.variety ? <Text style={[styles.cropVariety, { color: colors.mutedForeground }]}>{item.variety}</Text> : null}
                  </View>
                  <View style={[styles.catBadge, { backgroundColor: catColor + "22" }]}>
                    <Text style={[styles.catText, { color: catColor }]}>{item.category}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  {item.maturityDays ? (
                    <View style={styles.stat}>
                      <Feather name="clock" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.statText, { color: colors.mutedForeground }]}>{item.maturityDays}d</Text>
                    </View>
                  ) : null}
                  {item.waterNeeds ? (
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name={WATER_ICONS[item.waterNeeds.toLowerCase()] as never ?? "water"} size={13} color={colors.mutedForeground} />
                      <Text style={[styles.statText, { color: colors.mutedForeground }]}>{item.waterNeeds} water</Text>
                    </View>
                  ) : null}
                  {item.spacing ? (
                    <View style={styles.stat}>
                      <MaterialCommunityIcons name="ruler" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.statText, { color: colors.mutedForeground }]}>{item.spacing}</Text>
                    </View>
                  ) : null}
                </View>

                {item.description ? (
                  <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  monthCenter: { alignItems: "center" },
  monthName: { fontSize: 20, fontWeight: "700" },
  monthRegion: { fontSize: 12, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  list: { padding: 16, gap: 12 },
  adviceCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  adviceText: { flex: 1, fontSize: 13, lineHeight: 19 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  cropName: { fontSize: 15, fontWeight: "600" },
  cropVariety: { fontSize: 12, marginTop: 1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catText: { fontSize: 11, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 14 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12 },
  desc: { fontSize: 13, lineHeight: 18 },
});
