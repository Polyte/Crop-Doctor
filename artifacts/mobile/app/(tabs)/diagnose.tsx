import { useDiagnosis } from "@/context/DiagnosisContext";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Head from "expo-router/head";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SubjectType = "crop" | "livestock";

const CROP_TYPES = ["Maize", "Wheat", "Rice", "Tomato", "Potato", "Soybean", "Coffee", "Cassava", "Other"];
const LIVESTOCK_TYPES = ["Cattle", "Goat", "Sheep", "Chicken", "Pig", "Rabbit", "Other"];

export default function ScanScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addDiagnosis } = useDiagnosis();
  const params = useLocalSearchParams<{ type?: string }>();

  const [subjectType, setSubjectType] = useState<SubjectType>(
    params.type === "livestock" ? "livestock" : "crop"
  );
  const [subjectVariety, setSubjectVariety] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.type === "livestock" || params.type === "crop") {
      setSubjectType(params.type as SubjectType);
    }
  }, [params.type]);

  const varieties = subjectType === "crop" ? CROP_TYPES : LIVESTOCK_TYPES;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access needed", "Please allow camera access to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleDiagnose() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

      const body: Record<string, string> = {
        description: description.trim() || "No description provided",
        subjectType,
        lang: t("app.name") === "Farmguard" ? "en" : "sw",
      };
      if (subjectType === "crop" && subjectVariety) body.cropType = subjectVariety;
      if (subjectType === "livestock" && subjectVariety) body.livestockType = subjectVariety;
      if (imageBase64) body.imageBase64 = imageBase64;

      const response = await fetch(`${baseUrl}/api/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const result = await response.json();

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await addDiagnosis({
        id,
        ...result,
        subjectType,
        cropType: subjectType === "crop" ? subjectVariety : undefined,
        livestockType: subjectType === "livestock" ? subjectVariety : undefined,
        description: description.trim(),
        imageUri: imageUri ?? undefined,
        timestamp: new Date().toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/result/[id]", params: { id } });

      setDescription("");
      setImageUri(null);
      setImageBase64(null);
      setSubjectVariety("");
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Diagnosis failed", "Could not connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const ScrollComponent = Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;

  return (
    <ScrollComponent
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : 0 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Head>
        <title>Diagnose — Farmguard</title>
        <meta name="description" content="Upload a photo or describe symptoms to instantly identify crop diseases, pest damage, and livestock health conditions with AI diagnosis." />
      </Head>
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>New Diagnosis</Text>
      <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
        Photo + description gives the best results
      </Text>

      {/* Subject Type Toggle */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>What are you diagnosing?</Text>
        <View style={[styles.toggle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {(["crop", "livestock"] as SubjectType[]).map(type => (
            <Pressable
              key={type}
              style={[
                styles.toggleOption,
                subjectType === type && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setSubjectType(type);
                setSubjectVariety("");
                Haptics.selectionAsync();
              }}
            >
              <MaterialCommunityIcons
                name={type === "crop" ? "sprout" : "cow"}
                size={18}
                color={subjectType === type ? "#FFFFFF" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.toggleText,
                  { color: subjectType === type ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {type === "crop" ? "Crop" : "Livestock"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Variety selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {subjectType === "crop" ? "Crop type" : "Livestock type"}{" "}
          <Text style={{ color: colors.mutedForeground }}>(optional)</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {varieties.map(v => (
            <Pressable
              key={v}
              style={[
                styles.pill,
                {
                  backgroundColor: subjectVariety === v ? colors.primary : colors.card,
                  borderColor: subjectVariety === v ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setSubjectVariety(prev => prev === v ? "" : v);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: subjectVariety === v ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Image upload */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Photo <Text style={{ color: colors.mutedForeground }}>(optional but recommended)</Text>
        </Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <Pressable
              style={[styles.removeImage, { backgroundColor: colors.destructive }]}
              onPress={() => { setImageUri(null); setImageBase64(null); }}
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.imageBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={takePhoto}
            >
              <Feather name="camera" size={22} color={colors.primary} />
              <Text style={[styles.imageBtnText, { color: colors.foreground }]}>Camera</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.imageBtn,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={pickImage}
            >
              <Feather name="image" size={22} color={colors.primary} />
              <Text style={[styles.imageBtnText, { color: colors.foreground }]}>Gallery</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Describe the problem (optional)</Text>
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          ]}
          placeholder={
            subjectType === "crop"
              ? "e.g. Leaves turning yellow with brown spots, started 3 days ago. Affecting about half the field."
              : "e.g. Cow not eating, limping on left front leg, noticed swelling near hoof since yesterday."
          }
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          { backgroundColor: loading ? colors.mutedForeground : colors.primary, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={handleDiagnose}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.submitText}>Analyzing...</Text>
          </View>
        ) : (
          <View style={styles.loadingRow}>
            <MaterialCommunityIcons name="brain" size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>Diagnose with AI</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Powered by Claude AI. Results are advisory — consult an agricultural expert for critical issues.
      </Text>
    </ScrollComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24 },
  section: { marginBottom: 24 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  toggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  pills: { gap: 8, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  imageButtons: { flexDirection: "row", gap: 12 },
  imageBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imageBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  imageContainer: { position: "relative", alignSelf: "flex-start" },
  previewImage: { width: "100%", height: 200, borderRadius: 14 },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    lineHeight: 22,
  },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
});
