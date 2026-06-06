import { SeverityBadge } from "@/components/SeverityBadge";
import { DiagnosisRecord, useDiagnosis } from "@/context/DiagnosisContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Clipboard,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Section({ title, items, color, icon }: {
  title: string;
  items: string[];
  color: string;
  icon: string;
}) {
  const colors = useColors();
  if (!items || items.length === 0) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as never} size={18} color={color} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: color }]} />
          <Text style={[styles.bulletText, { color: colors.foreground }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { diagnoses, deleteDiagnosis } = useDiagnosis();
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);

  const record: DiagnosisRecord | undefined = useMemo(
    () => diagnoses.find(d => d.id === id),
    [diagnoses, id]
  );

  if (!record) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Diagnosis not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  function handleDelete() {
    Alert.alert("Delete Diagnosis", "Remove this diagnosis from your history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteDiagnosis(record!.id);
          router.back();
        },
      },
    ]);
  }

  const subjectLabel = record.subjectType === "crop"
    ? record.cropType || "Crop"
    : record.livestockType || "Livestock";

  const formattedDate = new Date(record.timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const urgencyColor = {
    low: colors.severityLow,
    medium: colors.severityMedium,
    high: colors.severityHigh,
    critical: colors.severityCritical,
  }[record.severity];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Diagnosis Result",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => setShowShare(true)} style={{ padding: 8 }}>
                <Feather name="share-2" size={20} color={colors.primary} />
              </Pressable>
              <Pressable onPress={handleDelete} style={{ padding: 8 }}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40, paddingTop: Platform.OS === "web" ? 20 : 0 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {record.imageUri && (
          <Image source={{ uri: record.imageUri }} style={styles.heroImage} />
        )}

        {/* Condition header */}
        <View style={[styles.conditionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.conditionRow}>
            <View style={[styles.subjectIcon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons
                name={record.subjectType === "crop" ? "sprout" : "cow"}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.conditionInfo}>
              <Text style={[styles.subjectLabel, { color: colors.mutedForeground }]}>
                {subjectLabel} · {formattedDate}
              </Text>
              <Text style={[styles.conditionName, { color: colors.foreground }]}>
                {record.condition}
              </Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <SeverityBadge severity={record.severity} />
            <View style={[styles.confidenceBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.confidenceText, { color: colors.mutedForeground }]}>
                {record.confidence.charAt(0).toUpperCase() + record.confidence.slice(1)} confidence
              </Text>
            </View>
          </View>
          <Text style={[styles.summary, { color: colors.foreground }]}>{record.summary}</Text>
        </View>

        {/* Urgency */}
        <View style={[styles.urgencyCard, { backgroundColor: urgencyColor + "18", borderColor: urgencyColor + "40" }]}>
          <MaterialCommunityIcons name="clock-alert" size={20} color={urgencyColor} />
          <Text style={[styles.urgencyText, { color: colors.foreground }]}>{record.urgency}</Text>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="text" size={18} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Description</Text>
          </View>
          <Text style={[styles.descText, { color: colors.mutedForeground }]}>{record.description}</Text>
        </View>

        <Section title="Symptoms" items={record.symptoms} color={colors.severityHigh} icon="alert-circle-outline" />
        <Section title="Possible Causes" items={record.causes} color={colors.severityMedium} icon="help-circle-outline" />
        <Section title="Treatments" items={record.treatments} color={colors.primary} icon="medical-bag" />
        <Section title="Prevention" items={record.prevention} color={colors.severityLow} icon="shield-check-outline" />

        {/* New Scan */}
        <Pressable
          style={({ pressed }) => [
            styles.newScanBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => router.push("/(tabs)/diagnose")}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.newScanText}>New Diagnosis</Text>
        </Pressable>

        {/* Share Modal */}
        <ShareModal
          visible={showShare}
          onClose={() => setShowShare(false)}
          record={record}
          colors={colors}
        />
      </ScrollView>
    </>
  );
}

// ─── Share Modal ───────────────────────────────────────────────────────
function ShareModal({
  visible,
  onClose,
  record,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  record: DiagnosisRecord;
  colors: ReturnType<typeof useColors>;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `✨ Farmguard Diagnosis

Condition: ${record.condition}
Severity: ${record.severity}
Confidence: ${record.confidence}

Summary:
${record.summary}

Symptoms:
${record.symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Treatments:
${record.treatments.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Prevention:
${record.prevention.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Urgency: ${record.urgency}

---
Shared from Farmguard - AI Farm Diagnosis
`.trim();

  const handleCopy = () => {
    Clipboard.setString(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    const url = `https://wa.me/?text=${text}`;
    if (Platform.OS !== "web") {
      const { Linking } = require("react-native");
      Linking.openURL(url);
    } else {
      window.open(url, "_blank");
    }
    onClose();
  };

  const handleSMS = () => {
    const text = encodeURIComponent(shareText.slice(0, 500));
    const url = `sms:?&body=${text}`;
    if (Platform.OS !== "web") {
      const { Linking } = require("react-native");
      Linking.openURL(url);
    } else {
      window.open(url, "_blank");
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent onRequestClose={onClose}>
      <View style={shareStyles.overlay}>
        <View style={[shareStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[shareStyles.handle, { backgroundColor: colors.border }]} />
          <Text style={[shareStyles.title, { color: colors.foreground }]}>Share Diagnosis</Text>

          <Pressable
            style={[shareStyles.btn, { backgroundColor: colors.primary }]}
            onPress={handleWhatsApp}
          >
            <MaterialCommunityIcons name="whatsapp" size={22} color="#fff" />
            <Text style={shareStyles.btnText}>Share via WhatsApp</Text>
          </Pressable>

          <Pressable
            style={[shareStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleSMS}
          >
            <Feather name="message-square" size={20} color={colors.foreground} />
            <Text style={[shareStyles.btnTextAlt, { color: colors.foreground }]}>Share via SMS</Text>
          </Pressable>

          <Pressable
            style={[shareStyles.btn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleCopy}
          >
            <Feather name="copy" size={20} color={colors.foreground} />
            <Text style={[shareStyles.btnTextAlt, { color: colors.foreground }]}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ marginTop: 8, padding: 12 }}>
            <Text style={[shareStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    justifyContent: "center",
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  btnTextAlt: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cancel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  backLink: { fontSize: 15, fontFamily: "Inter_500Medium" },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 4,
  },
  conditionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionInfo: { flex: 1 },
  subjectLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  conditionName: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  badgeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confidenceText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  summary: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  urgencyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  urgencyText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  newScanBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  newScanText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
});
