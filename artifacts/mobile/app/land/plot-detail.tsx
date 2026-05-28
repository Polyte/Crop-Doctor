import { useLandPlanner, type LandPlant } from "@/context/LandPlannerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_W } = Dimensions.get("window");

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#52B788",
  warning: "#E9C46A",
  sick: "#D62828",
  recovering: "#90BE6D",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "Healthy",
  warning: "Warning",
  sick: "Sick",
  recovering: "Recovering",
};

export default function PlotDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlot, deletePlot, addPlant, deletePlant, updatePlant } = useLandPlanner();

  const [plot, setPlot] = useState<Awaited<ReturnType<typeof getPlot>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState(Math.min(SCREEN_W - 40, 380));
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [tapX, setTapX] = useState(0);
  const [tapY, setTapY] = useState(0);
  const [plantName, setPlantName] = useState("");
  const [plantVariety, setPlantVariety] = useState("");
  const [plantPhoto, setPlantPhoto] = useState<string | null>(null);
  const [plantHealth, setPlantHealth] = useState("healthy");
  const [plantNotes, setPlantNotes] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setPlot(await getPlot(parseInt(id, 10))); } catch { Alert.alert("Error", "Could not load plot"); }
    finally { setLoading(false); }
  }, [id, getPlot]);

  useEffect(() => { load(); }, [load]);

  const polygon = plot ? (() => { try { return JSON.parse(plot.polygon) as { x: number; y: number }[]; } catch { return []; } })() : [];
  const ptsStr = polygon.map((p: { x: number; y: number }) => `${p.x * canvasSize},${p.y * canvasSize}`).join(" ");

  const handleCanvasTap = (x: number, y: number) => {
    setTapX(x / canvasSize);
    setTapY(y / canvasSize);
    setShowAddPlant(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSavePlant = async () => {
    if (!plantName.trim()) { Alert.alert("Missing name", "Enter a plant name."); return; }
    try {
      await addPlant({
        plotId: parseInt(id!, 10),
        name: plantName.trim(),
        variety: plantVariety.trim() || undefined,
        plantX: tapX,
        plantY: tapY,
        healthStatus: plantHealth,
        photoUri: plantPhoto ?? undefined,
        notes: plantNotes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddPlant(false);
      setPlantName(""); setPlantVariety(""); setPlantPhoto(null); setPlantHealth("healthy"); setPlantNotes("");
      load();
    } catch {
      Alert.alert("Error", "Could not save plant.");
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) setPlantPhoto(result.assets[0].uri);
  };

  if (loading || !plot) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{plot.name}</Text>
        <Pressable onPress={() => {
          Alert.alert("Delete Plot", `Remove "${plot.name}" and all its plants?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => { await deletePlot(plot.id); router.back(); } },
          ]);
        }} style={styles.backBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Plot canvas */}
        <View style={styles.canvasWrapper}>
          <View
            style={[styles.canvas, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onLayout={(e) => setCanvasSize(e.nativeEvent.layout.width)}
            onTouchEnd={(e) => {
              const { locationX, locationY } = e.nativeEvent;
              handleCanvasTap(locationX, locationY);
            }}
          >
            <Svg width={canvasSize} height={canvasSize} style={StyleSheet.absoluteFill}>
              {polygon.length >= 3 && (
                <Polygon points={ptsStr} fill={colors.primary} fillOpacity={0.12} stroke={colors.primary} strokeWidth={2} />
              )}
              {polygon.map((p: { x: number; y: number }, i: number) => (
                <React.Fragment key={i}>
                  <Circle cx={p.x * canvasSize} cy={p.y * canvasSize} r={4} fill={colors.primary} />
                  {i > 0 && <Line x1={polygon[i - 1].x * canvasSize} y1={polygon[i - 1].y * canvasSize} x2={p.x * canvasSize} y2={p.y * canvasSize} stroke={colors.primary} strokeWidth={1} />}
                </React.Fragment>
              ))}
              {polygon.length > 2 && (
                <Line x1={polygon[polygon.length - 1].x * canvasSize} y1={polygon[polygon.length - 1].y * canvasSize} x2={polygon[0].x * canvasSize} y2={polygon[0].y * canvasSize} stroke={colors.primary} strokeWidth={1} strokeDasharray="3,3" />
              )}
              {/* Plants */}
              {plot.plants?.map((plant: LandPlant) => {
                const cx = plant.plantX * canvasSize;
                const cy = plant.plantY * canvasSize;
                const color = HEALTH_COLORS[plant.healthStatus] ?? colors.primary;
                return (
                  <React.Fragment key={plant.id}>
                    <Circle cx={cx} cy={cy} r={10} fill={color} opacity={0.85} />
                    <Circle cx={cx} cy={cy} r={4} fill="#fff" />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
          <Text style={[styles.canvasHint, { color: colors.mutedForeground }]}>Tap anywhere on the plot to add a plant</Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{plot.plants?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Plants</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: HEALTH_COLORS.sick }]}>{plot.plants?.filter((p: LandPlant) => p.healthStatus === "sick").length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Sick</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: HEALTH_COLORS.warning }]}>{plot.plants?.filter((p: LandPlant) => p.healthStatus === "warning").length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Warning</Text>
          </View>
        </View>

        {/* Plant list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plants</Text>
          {plot.plants?.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="sprout-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No plants yet. Tap on the plot map to add your first plant.</Text>
            </View>
          ) : (
            <FlatList
              data={plot.plants}
              keyExtractor={(p) => String(p.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => {
                const hColor = HEALTH_COLORS[item.healthStatus] ?? colors.primary;
                return (
                  <Pressable
                    style={[styles.plantRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => { router.push({ pathname: "/land/plant-detail", params: { id: String(item.id) } }); Haptics.selectionAsync(); }}
                  >
                    <View style={[styles.healthDot, { backgroundColor: hColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.plantName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                      {item.variety ? <Text style={[styles.plantVariety, { color: colors.mutedForeground }]}>{item.variety}</Text> : null}
                      <Text style={[styles.plantStatus, { color: hColor }]}>{HEALTH_LABELS[item.healthStatus] ?? item.healthStatus}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Plant Modal */}
      <Modal visible={showAddPlant} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddPlant(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Plant</Text>
            <Pressable onPress={() => setShowAddPlant(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Plant Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} value={plantName} onChangeText={setPlantName} placeholder="e.g. Tomato" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Variety (optional)</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} value={plantVariety} onChangeText={setPlantVariety} placeholder="e.g. Roma VF" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Health Status</Text>
              <View style={styles.healthRow}>
                {(["healthy", "warning", "sick", "recovering"] as const).map((h) => (
                  <Pressable key={h} style={[styles.healthPill, { backgroundColor: plantHealth === h ? HEALTH_COLORS[h] : colors.card, borderColor: plantHealth === h ? HEALTH_COLORS[h] : colors.border }]} onPress={() => { setPlantHealth(h); Haptics.selectionAsync(); }}>
                    <Text style={{ color: plantHealth === h ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{HEALTH_LABELS[h]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Photo (optional)</Text>
              <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickPhoto}>
                {plantPhoto ? (
                  <Text style={{ color: colors.foreground }}>Photo selected ✓</Text>
                ) : (
                  <>
                    <Feather name="camera" size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "500" }}>Take or pick photo</Text>
                  </>
                )}
              </Pressable>
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Notes (optional)</Text>
              <TextInput style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} value={plantNotes} onChangeText={setPlantNotes} placeholder="Planting date, source, etc." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} />
            </View>
            <Pressable style={[styles.saveBtnBig, { backgroundColor: colors.primary }]} onPress={handleSavePlant}>
              <Text style={styles.saveBtnBigText}>Add Plant</Text>
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 8 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  canvasWrapper: { alignItems: "center", marginTop: 16 },
  canvas: { width: "100%", maxWidth: 380, aspectRatio: 1, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  canvasHint: { fontSize: 12, marginTop: 8 },
  statsRow: { flexDirection: "row", marginTop: 20, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  empty: { alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 16, borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center" },
  plantRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  healthDot: { width: 12, height: 12, borderRadius: 6 },
  plantName: { fontSize: 15, fontWeight: "600" },
  plantVariety: { fontSize: 12, marginTop: 1 },
  plantStatus: { fontSize: 12, marginTop: 2, fontWeight: "600" },
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalScroll: { flex: 1, paddingHorizontal: 20 },
  field: { marginTop: 14 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  healthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  healthPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  saveBtnBig: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  saveBtnBigText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
