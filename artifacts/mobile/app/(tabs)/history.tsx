import { DiagnosisCard } from "@/components/DiagnosisCard";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Filter = "all" | "crop" | "livestock";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { diagnoses, clearAll } = useDiagnosis();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = diagnoses.filter(d => {
    if (filter === "all") return true;
    return d.subjectType === filter;
  });

  function handleClearAll() {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all diagnosis records?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: clearAll },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter bar */}
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === "web" ? 67 : 12,
          },
        ]}
      >
        <View style={styles.filterRow}>
          {(["all", "crop", "livestock"] as Filter[]).map(f => (
            <Pressable
              key={f}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: filter === f ? colors.primary : colors.card,
                  borderColor: filter === f ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {f === "all" ? "All" : f === "crop" ? "Crops" : "Livestock"}
              </Text>
            </Pressable>
          ))}
          {diagnoses.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={handleClearAll}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={colors.destructive} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <DiagnosisCard record={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={56}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === "all" ? "No diagnoses yet" : `No ${filter} diagnoses yet`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Your diagnosis history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  clearBtn: {
    marginLeft: "auto",
    padding: 8,
  },
  list: {
    padding: 20,
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
