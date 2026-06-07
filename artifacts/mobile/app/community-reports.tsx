import { useColors } from "@/hooks/useColors";
import { useLocation } from "@/context/LocationContext";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const DEVICE_KEY = "farmguard_device_id";

interface DiseaseReport {
  id: number;
  deviceId: string;
  lat: number;
  lon: number;
  cropName: string;
  disease: string;
  severity: string;
  description: string | null;
  createdAt: string;
  distance?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#52B788",
  medium: "#F9C74F",
  high: "#F4A261",
  critical: "#EF233C",
};

const CROPS = ["Maize","Tomato","Bean","Potato","Cassava","Banana","Wheat","Sorghum","Onion","Cabbage","Other"];
const SEVERITIES = ["low","medium","high","critical"];

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDist(km?: number): string {
  if (km == null) return "";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export default function CommunityReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location } = useLocation();

  const [reports, setReports] = useState<DiseaseReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [crop, setCrop] = useState("Maize");
  const [disease, setDisease] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/community/reports`;
      if (location?.latitude) url += `?lat=${location.latitude}&lon=${location.longitude}&radius=200`;
      const res = await fetch(url);
      if (res.ok) setReports(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const submitReport = async () => {
    if (!disease.trim()) { Alert.alert("Missing info", "Please enter the disease or problem you observed."); return; }
    if (!location?.latitude) { Alert.alert("No location", "Set your location first so others can see where the outbreak is."); return; }
    setSubmitting(true);
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = Math.random().toString(36).slice(2);
        await AsyncStorage.setItem(DEVICE_KEY, deviceId);
      }
      const res = await fetch(`${API_BASE}/community/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, lat: location.latitude, lon: location.longitude, cropName: crop, disease: disease.trim(), severity, description: description.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowForm(false);
      setDisease("");
      setDescription("");
      setSeverity("medium");
      await loadReports();
      Alert.alert("Reported!", "Your disease sighting has been shared with nearby farmers.");
    } catch {
      Alert.alert("Error", "Could not submit report. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Disease Outbreaks</Text>
        <Pressable onPress={() => { setShowForm(true); Haptics.impactAsync(); }} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.banner, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.primary} />
        <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
          {location ? `Showing outbreaks near ${location.displayName}` : "Showing all recent reports — set location to see nearby"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : reports.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="bug-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No reports yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Be the first to report a disease sighting in your area.</Text>
          <Pressable style={[styles.reportBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(true)}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.reportBtnText}>Report Disease</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          renderItem={({ item }) => {
            const sev = item.severity ?? "medium";
            const sevColor = SEVERITY_COLORS[sev] ?? "#F9C74F";
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.sevBadge, { backgroundColor: sevColor + "22" }]}>
                    <Text style={[styles.sevText, { color: sevColor }]}>{sev.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{timeAgo(item.createdAt)}</Text>
                  {item.distance != null && (
                    <Text style={[styles.dist, { color: colors.mutedForeground }]}>{formatDist(item.distance)}</Text>
                  )}
                </View>
                <Text style={[styles.disease, { color: colors.foreground }]}>{item.disease}</Text>
                <Text style={[styles.cropLabel, { color: colors.mutedForeground }]}>
                  <MaterialCommunityIcons name="sprout" size={13} color={colors.mutedForeground} /> {item.cropName}
                </Text>
                {item.description ? <Text style={[styles.desc, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
              </View>
            );
          }}
        />
      )}

      {/* Report form modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report Disease Sighting</Text>
            <Pressable onPress={() => setShowForm(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.foreground }]}>Crop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CROPS.map(c => (
                  <Pressable key={c} style={[styles.pill, { backgroundColor: crop === c ? colors.primary : colors.card, borderColor: crop === c ? colors.primary : colors.border }]} onPress={() => setCrop(c)}>
                    <Text style={[styles.pillText, { color: crop === c ? "#fff" : colors.foreground }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.label, { color: colors.foreground }]}>Disease / Problem *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Leaf blight, Stem rust, Aphids..."
              placeholderTextColor={colors.mutedForeground}
              value={disease}
              onChangeText={setDisease}
            />

            <Text style={[styles.label, { color: colors.foreground }]}>Severity</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {SEVERITIES.map(s => {
                const sc = SEVERITY_COLORS[s];
                return (
                  <Pressable key={s} style={[styles.pill, { backgroundColor: severity === s ? sc : colors.card, borderColor: severity === s ? sc : colors.border }]} onPress={() => setSeverity(s)}>
                    <Text style={[styles.pillText, { color: severity === s ? "#fff" : colors.foreground }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.foreground }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Describe what you're seeing..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={submitReport}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>Submit Report</Text>}
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
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  bannerText: { fontSize: 12, flex: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  reportBtnText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sevText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  timeAgo: { fontSize: 12, marginLeft: "auto" },
  dist: { fontSize: 12 },
  disease: { fontSize: 15, fontWeight: "700" },
  cropLabel: { fontSize: 12, marginTop: 2 },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  modal: { flex: 1, padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: "500" },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
