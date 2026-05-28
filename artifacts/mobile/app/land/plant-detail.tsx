import { useLandPlanner, type PlantFollowup } from "@/context/LandPlannerContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import * as ImagePicker from "expo-image-picker";

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

const ACTIONS = ["Fertilized", "Sprayed", "Pruned", "Watered", "Checked", "Treated", "Harvested", "Other"];

export default function PlantDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlant, updatePlant, deletePlant, addFollowup } = useLandPlanner();

  const [plant, setPlant] = useState<Awaited<ReturnType<typeof getPlant>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowup, setShowFollowup] = useState(false);
  const [action, setAction] = useState("Checked");
  const [fuDesc, setFuDesc] = useState("");
  const [fuHealth, setFuHealth] = useState("healthy");
  const [fuPhoto, setFuPhoto] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setPlant(await getPlant(parseInt(id, 10))); } catch { Alert.alert("Error", "Could not load plant"); }
    finally { setLoading(false); }
  }, [id, getPlant]);

  useEffect(() => { load(); }, [load]);

  const handleAddFollowup = async () => {
    try {
      await addFollowup({
        plantId: parseInt(id!, 10),
        action,
        description: fuDesc.trim() || undefined,
        healthStatus: fuHealth,
        photoUri: fuPhoto ?? undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFollowup(false);
      setFuDesc(""); setFuPhoto(null); setFuHealth("healthy"); setAction("Checked");
      load();
    } catch {
      Alert.alert("Error", "Could not add follow-up.");
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0]) setFuPhoto(result.assets[0].uri);
  };

  if (loading || !plant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const hColor = HEALTH_COLORS[plant.healthStatus] ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{plant.name}</Text>
        <Pressable onPress={() => {
          Alert.alert("Delete Plant", `Remove "${plant.name}" from this plot?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => { await deletePlant(plant.id); router.back(); } },
          ]);
        }} style={styles.backBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.healthBadge, { backgroundColor: hColor + "22" }]}>
            <View style={[styles.healthDot, { backgroundColor: hColor }]} />
            <Text style={[styles.healthText, { color: hColor }]}>{HEALTH_LABELS[plant.healthStatus] ?? plant.healthStatus}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{plant.name}</Text>
          {plant.variety ? <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{plant.variety}</Text> : null}
          {plant.notes ? <Text style={[styles.heroNotes, { color: colors.mutedForeground }]}>{plant.notes}</Text> : null}

          {/* Actions */}
          <View style={styles.heroActions}>
            <Pressable style={[styles.heroBtn, { backgroundColor: colors.primary }]} onPress={() => { setShowFollowup(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
              <Feather name="check-circle" size={16} color="#fff" />
              <Text style={styles.heroBtnText}>Log Follow-up</Text>
            </Pressable>
            <Pressable style={[styles.heroBtnOutline, { borderColor: colors.primary }]} onPress={() => { router.push({ pathname: "/scan", params: { type: "crop", plantId: String(plant.id) } }); }}>
              <MaterialCommunityIcons name="brain" size={16} color={colors.primary} />
              <Text style={[styles.heroBtnOutlineText, { color: colors.primary }]}>AI Diagnose</Text>
            </Pressable>
          </View>
        </View>

        {/* Health history */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Care Log</Text>
          {plant.followups?.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No follow-ups yet. Log your first care activity.</Text>
            </View>
          ) : (
            <FlatList
              data={plant.followups}
              keyExtractor={(f) => String(f.id)}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <View style={[styles.followupRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.followupIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="activity" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.followupAction, { color: colors.foreground }]}>{item.action}</Text>
                      <Text style={[styles.followupDate, { color: colors.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    {item.description ? <Text style={[styles.followupDesc, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
                    <View style={[styles.followupHealth, { backgroundColor: (HEALTH_COLORS[item.healthStatus] ?? colors.primary) + "22" }]}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: HEALTH_COLORS[item.healthStatus] ?? colors.primary }}>{HEALTH_LABELS[item.healthStatus] ?? item.healthStatus}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Follow-up Modal */}
      <Modal visible={showFollowup} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFollowup(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Follow-up</Text>
            <Pressable onPress={() => setShowFollowup(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Action</Text>
              <View style={styles.actionGrid}>
                {ACTIONS.map((a) => (
                  <Pressable key={a} style={[styles.actionPill, { backgroundColor: action === a ? colors.primary : colors.card, borderColor: action === a ? colors.primary : colors.border }]} onPress={() => { setAction(a); Haptics.selectionAsync(); }}>
                    <Text style={{ color: action === a ? "#fff" : colors.foreground, fontSize: 13, fontWeight: "500" }}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>New Health Status</Text>
              <View style={styles.healthRow}>
                {(["healthy", "warning", "sick", "recovering"] as const).map((h) => (
                  <Pressable key={h} style={[styles.healthPill, { backgroundColor: fuHealth === h ? HEALTH_COLORS[h] : colors.card, borderColor: fuHealth === h ? HEALTH_COLORS[h] : colors.border }]} onPress={() => { setFuHealth(h); Haptics.selectionAsync(); }}>
                    <Text style={{ color: fuHealth === h ? "#fff" : colors.foreground, fontSize: 12, fontWeight: "600" }}>{HEALTH_LABELS[h]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
              <TextInput style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} value={fuDesc} onChangeText={setFuDesc} placeholder="What did you do? Any observations?" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} />
            </View>
            <View style={[styles.field]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Photo (optional)</Text>
              <Pressable style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickPhoto}>
                {fuPhoto ? <Text style={{ color: colors.foreground }}>Photo selected ✓</Text> : (
                  <>
                    <Feather name="camera" size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: "500" }}>Take or pick photo</Text>
                  </>
                )}
              </Pressable>
            </View>
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddFollowup}>
              <Text style={styles.saveBtnText}>Save Follow-up</Text>
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
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginTop: 16, gap: 8 },
  healthBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  healthText: { fontSize: 13, fontWeight: "600" },
  heroTitle: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  heroSub: { fontSize: 14, marginTop: 2 },
  heroNotes: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  heroBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  heroBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 2 },
  heroBtnOutlineText: { fontWeight: "600", fontSize: 14 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  empty: { alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 16, borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center" },
  followupRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  followupIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  followupAction: { fontSize: 15, fontWeight: "600" },
  followupDate: { fontSize: 11 },
  followupDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  followupHealth: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalScroll: { flex: 1, paddingHorizontal: 20 },
  field: { marginTop: 14 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: "top" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  healthRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  healthPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
