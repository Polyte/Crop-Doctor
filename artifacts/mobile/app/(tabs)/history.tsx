import { DiagnosisCard } from "@/components/DiagnosisCard";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Filter = "all" | "crop" | "livestock";

export default function HistoryScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { diagnoses, clearAll } = useDiagnosis();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = diagnoses.filter(d => {
    const matchType = filter === "all" || d.subjectType === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || d.condition?.toLowerCase().includes(q)
      || d.cropType?.toLowerCase().includes(q)
      || d.livestockType?.toLowerCase().includes(q)
      || d.description?.toLowerCase().includes(q)
      || d.symptoms?.some(s => s.toLowerCase().includes(q));
    return matchType && matchSearch;
  });

  function handleClearAll() {
    Alert.alert(
      t("clear.history"),
      t("clear.history.confirm"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("delete.all"), style: "destructive", onPress: clearAll },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Head>
        <title>{t("diagnosis.history")}</title>
        <meta name="description" content="Review your past crop and livestock AI diagnoses. Track conditions over time and revisit treatment recommendations." />
      </Head>

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
        {/* Search bar */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by crop, disease, symptom…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== "ios" && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filter row */}
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
                {f === "all" ? t("all") : f === "crop" ? t("crops") : t("livestock")}
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
              {search ? "No matches found" : filter === "all" ? t("no.diagnoses") : t("no.filter.diagnoses")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search ? "Try a different search term" : t("history.appears.here")}
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
    gap: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
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
