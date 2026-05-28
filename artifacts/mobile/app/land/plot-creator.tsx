import { useLandPlanner } from "@/context/LandPlannerContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polygon } from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const CANVAS_SIZE = Math.min(SCREEN_W - 40, 380);

interface Point { x: number; y: number }

export default function PlotCreatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createPlot } = useLandPlanner();

  const [points, setPoints] = useState<Point[]>([]);
  const [mode, setMode] = useState<"draw" | "plant">("draw");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("m²");
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const units = ["m²", "acres", "ha", "ft²"];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const x = locationX / canvasSize;
        const y = locationY / canvasSize;

        // Check if tapping near an existing point (drag)
        const threshold = 18 / canvasSize;
        const near = points.findIndex((p) => Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold);
        if (near >= 0 && mode === "draw") {
          dragIndex.current = near;
          setIsDragging(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return;
        }

        if (mode === "draw") {
          setPoints((prev) => [...prev, { x, y }]);
          Haptics.selectionAsync();
        }
      },
      onPanResponderMove: (evt) => {
        if (dragIndex.current == null || !isDragging) return;
        const { locationX, locationY } = evt.nativeEvent;
        const x = Math.max(0, Math.min(1, locationX / canvasSize));
        const y = Math.max(0, Math.min(1, locationY / canvasSize));
        setPoints((prev) => {
          const next = [...prev];
          next[dragIndex.current!] = { x, y };
          return next;
        });
      },
      onPanResponderRelease: () => {
        dragIndex.current = null;
        setIsDragging(false);
      },
    }),
  ).current;

  const handleSave = async () => {
    if (points.length < 3) {
      Alert.alert("Not enough points", "Draw at least 3 points to form a plot shape.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Missing name", "Give your plot a name.");
      return;
    }
    try {
      await createPlot({
        name: name.trim(),
        area: area ? parseFloat(area) : undefined,
        unit,
        polygon: points,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save plot. Try again.");
    }
  };

  const ptsStr = points.map((p) => `${p.x * canvasSize},${p.y * canvasSize}`).join(" ");

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Land Plot</Text>
        <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Mode toggle */}
        <View style={[styles.modeRow, { backgroundColor: colors.muted }]}>
          {(["draw", "plant"] as const).map((m) => (
            <Pressable
              key={m}
              style={[styles.modeBtn, mode === m && { backgroundColor: colors.card }]}
              onPress={() => { setMode(m); Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons name={m === "draw" ? "shape-polygon-plus" : "sprout"} size={16} color={mode === m ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.modeText, { color: mode === m ? colors.primary : colors.mutedForeground, fontWeight: mode === m ? "600" : "400" }]}>
                {m === "draw" ? "Draw Shape" : "Drop Plants"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Canvas */}
        <View style={styles.canvasWrapper}>
          <View
            style={[styles.canvas, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onLayout={(e: LayoutChangeEvent) => setCanvasSize(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <Svg width={canvasSize} height={canvasSize} style={StyleSheet.absoluteFill}>
              {points.length >= 3 && (
                <Polygon points={ptsStr} fill={colors.primary} fillOpacity={0.15} stroke={colors.primary} strokeWidth={2} />
              )}
              {points.map((p, i) => (
                <React.Fragment key={i}>
                  <Circle cx={p.x * canvasSize} cy={p.y * canvasSize} r={6} fill={mode === "draw" ? colors.primary : "#fff"} stroke={colors.primary} strokeWidth={2} />
                  {i > 0 && (
                    <Line x1={points[i - 1].x * canvasSize} y1={points[i - 1].y * canvasSize} x2={p.x * canvasSize} y2={p.y * canvasSize} stroke={colors.primary} strokeWidth={1.5} />
                  )}
                </React.Fragment>
              ))}
              {points.length > 2 && (
                <Line
                  x1={points[points.length - 1].x * canvasSize}
                  y1={points[points.length - 1].y * canvasSize}
                  x2={points[0].x * canvasSize}
                  y2={points[0].y * canvasSize}
                  stroke={colors.primary}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              )}
            </Svg>
          </View>
          <Text style={[styles.canvasHint, { color: colors.mutedForeground }]}>
            {mode === "draw" ? "Tap to add corners · Drag to move · Min 3 points" : "Tap inside plot to place plants"}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.muted }]} onPress={() => setPoints((prev) => prev.slice(0, -1))}>
            <Feather name="corner-up-left" size={16} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Undo</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.muted }]} onPress={() => setPoints([])}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Clear</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: colors.muted }]} onPress={() => setPoints((prev) => [...prev, prev[0]].slice(0, -1))}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Close</Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Plot Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Main Vegetable Patch"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Area</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={area}
                onChangeText={setArea}
                placeholder="e.g. 500"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Unit</Text>
              <View style={styles.unitRow}>
                {units.map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.unitPill, { backgroundColor: unit === u ? colors.primary : colors.card, borderColor: unit === u ? colors.primary : colors.border }]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={{ color: unit === u ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "500" }}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  modeRow: { flexDirection: "row", borderRadius: 12, padding: 4, marginTop: 16, marginBottom: 12 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  modeText: { fontSize: 13 },
  canvasWrapper: { alignItems: "center", marginTop: 8 },
  canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  canvasHint: { fontSize: 12, marginTop: 8 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  actionText: { fontSize: 13, fontWeight: "500" },
  form: { marginTop: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: "row", gap: 12 },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  unitPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
