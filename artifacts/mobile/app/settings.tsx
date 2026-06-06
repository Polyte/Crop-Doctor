import { useI18n } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const colors = useColors();
  const { t, lang, setLang } = useI18n();
  const { permission, requestPermission } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: t("settings"), headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {/* Language */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t("language")}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => setLang("en")}
          >
            <Text style={[styles.rowText, { color: colors.foreground }]}>{t("english")}</Text>
            {lang === "en" && <Feather name="check" size={18} color={colors.primary} />}
          </Pressable>
          <Pressable style={styles.row} onPress={() => setLang("sw")}>
            <Text style={[styles.rowText, { color: colors.foreground }]}>{t("swahili")}</Text>
            {lang === "sw" && <Feather name="check" size={18} color={colors.primary} />}
          </Pressable>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>{t("notifications")}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[styles.rowText, { color: colors.foreground }]}>{t("enable.notifications")}</Text>
            </View>
            <Switch
              value={permission}
              onValueChange={requestPermission}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={Platform.OS === "ios" ? "#fff" : permission ? colors.primary : "#f4f3f4"}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
