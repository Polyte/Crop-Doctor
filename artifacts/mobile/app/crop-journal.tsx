import { useCropJournal, type JournalActivity, type JournalEntry } from "@/context/CropJournalContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const ACTIVITIES: { key: JournalActivity; label: string; icon: string; color: string }[] = [
  { key: "watering", label: "Watering", icon: "water", color: "#4FC3F7" },
  { key: "weeding", label: "Weeding", icon: "grass", color: "#81C784" },
  { key: "fertilizing", label: "Fertilizing", icon: "spray", color: "#FFB74D" },
  { key: "harvesting", label: "Harvesting", icon: "basket", color: "#F4A261" },
  { key: "pruning", label: "Pruning", icon: "content-cut", color: "#CE93D8" },
  { key: "spraying", label: "Spraying", icon: "bottle-tonic-skull-outline", color: "#EF9A9A" },
  { key: "sowing", label: "Sowing", icon: "seed-outline", color: "#A5D6A7" },
  { key: "observation", label: "Observation", icon: "eye-outline", color: "#90CAF9" },
  { key: "other", label: "Other", icon: "dots-horizontal", color: "#B0BEC5" },
];

function getActivity(key: JournalActivity) {
  return ACTIVITIES.find((a) => a.key === key) ?? ACTIVITIES[ACTIVITIES.length - 1];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function CropJournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, addEntry, deleteEntry } = useCropJournal();
  const [showForm, setShowForm] = useState(false);

  const [activity, setActivity] = useState<JournalActivity>("watering");
  const [cropType, setCropType] = useState("");
  const [plotName, setPlotName] = useState("");
  const [notes, setNotes] = useState("");
  const [weatherNote, setWeatherNote] = useState("");

  function resetForm() {
    setActivity("watering");
    setCropType("");
    setPlotName("");
    setNotes("");
    setWeatherNote("");
  }

  async function handleSave() {
    if (!notes.trim()) {
      Alert.alert("Required", "Please add a note.");
      return;
    }
    await addEntry({
      date: new Date().toISOString(),
      activity,
      cropType: cropType.trim() || undefined,
      plotName: plotName.trim() || undefined,
      notes: notes.trim(),
      weatherNote: weatherNote.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    setShowForm(false);
  }

  function handleDelete(entry: JournalEntry) {
    Alert.alert("Delete Entry", "Remove this journal entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteEntry(entry.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  const act = getActivity(activity);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Farm Journal</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => { setShowForm(true); Haptics.selectionAsync(); }}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="notebook-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No entries yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Log your daily farm activities — watering, weeding, harvesting and more.
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowForm(true)}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add First Entry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const a = getActivity(item.activity);
            return (
              <Pressable
                style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onLongPress={() => handleDelete(item)}
              >
                <View style={[styles.activityDot, { backgroundColor: a.color + "30" }]}>
                  <MaterialCommunityIcons name={a.icon as never} size={20} color={a.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.entryRow}>
                    <Text style={[styles.activityLabel, { color: a.color }]}>{a.label}</Text>
                    <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
                  </View>
                  {(item.cropType || item.plotName) && (
                    <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
                      {[item.cropType, item.plotName].filter(Boolean).join(" · ")}
                    </Text>
                  )}
                  <Text style={[styles.entryNotes, { color: colors.foreground }]} numberOfLines={3}>{item.notes}</Text>
                  {item.weatherNote && (
                    <View style={styles.weatherRow}>
                      <MaterialCommunityIcons name="weather-partly-cloudy" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.weatherText, { color: colors.mutedForeground }]}>{item.weatherNote}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Journal Entry</Text>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Activity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activityRow}>
              {ACTIVITIES.map((a) => (
                <Pressable
                  key={a.key}
                  style={[
                    styles.activityPill,
                    {
                      backgroundColor: activity === a.key ? a.color : colors.card,
                      borderColor: activity === a.key ? a.color : colors.border,
                    },
                  ]}
                  onPress={() => { setActivity(a.key); Haptics.selectionAsync(); }}
                >
                  <MaterialCommunityIcons name={a.icon as never} size={14} color={activity === a.key ? "#fff" : a.color} />
                  <Text style={[styles.activityPillText, { color: activity === a.key ? "#fff" : colors.foreground }]}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Crop (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Maize, Tomato"
              placeholderTextColor={colors.mutedForeground}
              value={cropType}
              onChangeText={setCropType}
            />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Plot / Field Name (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. North Field, Plot A"
              placeholderTextColor={colors.mutedForeground}
              value={plotName}
              onChangeText={setPlotName}
            />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Notes *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="What did you observe or do? Any issues noticed?"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.formLabel, { color: colors.foreground }]}>Weather Note (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Sunny, 28°C · Heavy rain"
              placeholderTextColor={colors.mutedForeground}
              value={weatherNote}
              onChangeText={setWeatherNote}
            />

            <View style={styles.formBtns}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => { resetForm(); setShowForm(false); }}
              >
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Entry</Text>
              </Pressable>
            </View>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  list: { padding: 16, gap: 12, paddingBottom: 60 },
  entryCard: { flexDirection: "row", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  activityDot: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  entryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  activityLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  entryDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  entryMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  entryNotes: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 2 },
  weatherRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  weatherText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modalContainer: { flex: 1, paddingHorizontal: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 20 },
  formContent: { paddingBottom: 60, gap: 4 },
  formLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 12 },
  activityRow: { gap: 8, paddingVertical: 2 },
  activityPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  activityPillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top" },
  formBtns: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
