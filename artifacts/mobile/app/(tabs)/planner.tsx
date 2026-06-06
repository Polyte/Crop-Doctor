import { MoonPhaseIcon } from "@/components/MoonPhaseIcon";
import { GrowPlan, useGrowPlan } from "@/context/GrowPlanContext";
import { useLocation } from "@/context/LocationContext";
import { useI18n } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationContext";
import { useColors } from "@/hooks/useColors";
import { getMoonPhase, getNextMoonEvents } from "@/utils/moonPhase";
import { getSeason, getSeasonCropRecommendations } from "@/utils/season";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Head from "expo-router/head";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlannerScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { scheduleReminder } = useNotifications();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location, setLocation, clearLocation, loading: locationLoading } = useLocation();
  const { plans, addPlan } = useGrowPlan();

  const [locationFetching, setLocationFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const today = new Date();
  const moonPhase = getMoonPhase(today);
  const nextEvents = getNextMoonEvents(today).slice(0, 4);
  const seasonInfo = location ? getSeason(location.latitude, today) : null;
  const recommendedCrops = seasonInfo
    ? getSeasonCropRecommendations(seasonInfo.season, seasonInfo.hemisphere)
    : [];

  async function requestLocation() {
    setLocationFetching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setManualMode(true);
        setLocationFetching(false);
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = coords.coords.latitude;
      const lon = coords.coords.longitude;

      let country = "";
      let region = "";
      let displayName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geo) {
          country = geo.country ?? "";
          region = geo.region ?? geo.city ?? "";
          displayName = [geo.city ?? geo.region, geo.country].filter(Boolean).join(", ") || displayName;
        }
      } catch {
        // Geocoding unavailable on web — use coordinates as display name
      }

      await setLocation({ latitude: lat, longitude: lon, country, region, displayName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Location error", "Could not fetch location. Please enter it manually.");
      setManualMode(true);
    } finally {
      setLocationFetching(false);
    }
  }

  async function saveManualLocation() {
    if (!manualInput.trim()) return;
    await setLocation({
      latitude: 20,
      longitude: 0,
      country: manualInput.trim(),
      region: "",
      displayName: manualInput.trim(),
    });
    setManualMode(false);
    Haptics.selectionAsync();
  }

  async function generatePlan() {
    if (!selectedCrop || !location || !seasonInfo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const res = await fetch(`${baseUrl}/api/grow-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: selectedCrop,
          location: location.displayName,
          season: seasonInfo.label,
          hemisphere: seasonInfo.hemisphere,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
      const plan: GrowPlan = {
        id,
        cropName: selectedCrop,
        location: location.displayName,
        season: seasonInfo.label,
        hemisphere: seasonInfo.hemisphere,
        totalDays: data.totalDays,
        startDate: today.toISOString(),
        phases: data.phases,
        moonGuide: data.moonGuide,
        generalTips: data.generalTips,
        timestamp: today.toISOString(),
      };
      await addPlan(plan);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/grow-plan/[id]", params: { id } });
      setSelectedCrop(null);

      // Schedule reminder for start date
      await scheduleReminder(
        t("grow.plan.reminder"),
        `${t("plant")} ${selectedCrop} ${t("starting.today")}!`,
        3600,
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), t("grow.plan.error"));
    } finally {
      setGenerating(false);
    }
  }

  if (locationLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : 0 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Head>
        <title>Grow Planner — Farmguard</title>
        <meta name="description" content="Plan your planting with moon phase guidance. Get AI-generated grow schedules tailored to your location, season, and crop — including biodynamic moon advice." />
      </Head>
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Grow Planner</Text>
      <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
        Moon-aware planting calendar for your season
      </Text>

      {/* Moon Today */}
      <View style={[styles.moonCard, { backgroundColor: "#1B2838", borderColor: "#2D3F55" }]}>
        <View style={styles.moonLeft}>
          <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
          <View>
            <Text style={styles.moonPhaseName}>{moonPhase.name}</Text>
            <Text style={styles.moonIllum}>
              {Math.round(moonPhase.illumination * 100)}% illuminated
            </Text>
          </View>
        </View>
        <View style={[styles.moonAdviceBubble, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
          <Text style={styles.moonAdviceText}>{moonPhase.gardeningAdvice}</Text>
        </View>
      </View>

      {/* Upcoming Moon Events */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Moon Events</Text>
        <View style={styles.eventsRow}>
          {nextEvents.map((ev, i) => (
            <View key={i} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.eventEmoji}>{ev.emoji}</Text>
              <Text style={[styles.eventName, { color: colors.foreground }]} numberOfLines={2}>
                {ev.name}
              </Text>
              <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                {ev.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Location Card */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Location</Text>
        {location && !manualMode ? (
          <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.locationRow}>
              <View style={[styles.locationIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={18} color={colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: colors.foreground }]}>{location.displayName}</Text>
                {seasonInfo && (
                  <Text style={[styles.locationSeason, { color: colors.mutedForeground }]}>
                    {seasonInfo.emoji} {seasonInfo.label} · {seasonInfo.hemisphere} hemisphere
                  </Text>
                )}
              </View>
              <Pressable onPress={() => { clearLocation(); setSelectedCrop(null); }}>
                <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {seasonInfo && (
              <Text style={[styles.seasonDesc, { color: colors.mutedForeground }]}>
                {seasonInfo.description}
              </Text>
            )}
          </View>
        ) : manualMode ? (
          <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.manualLabel, { color: colors.mutedForeground }]}>
              Enter your country or city:
            </Text>
            <TextInput
              style={[styles.manualInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
              placeholder="e.g. Kenya, Nairobi"
              placeholderTextColor={colors.mutedForeground}
              value={manualInput}
              onChangeText={setManualInput}
              returnKeyType="done"
              onSubmitEditing={saveManualLocation}
            />
            <View style={styles.manualBtns}>
              <Pressable
                style={({ pressed }) => [styles.manualSaveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={saveManualLocation}
              >
                <Text style={styles.manualSaveBtnText}>Save</Text>
              </Pressable>
              <Pressable onPress={() => setManualMode(false)} style={styles.manualCancelBtn}>
                <Text style={[styles.manualCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.locationButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.locBtn,
                { backgroundColor: colors.primary, opacity: pressed || locationFetching ? 0.85 : 1 },
              ]}
              onPress={requestLocation}
              disabled={locationFetching}
            >
              {locationFetching ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Feather name="map-pin" size={18} color="#FFF" />
              )}
              <Text style={styles.locBtnText}>
                {locationFetching ? "Detecting..." : "Use My Location"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.locBtnOutline,
                { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => setManualMode(true)}
            >
              <Feather name="edit-2" size={16} color={colors.primary} />
              <Text style={[styles.locBtnOutlineText, { color: colors.primary }]}>Enter Manually</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Crop Selection */}
      {location && seasonInfo && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Crops for {seasonInfo.label}
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Select a crop to generate your personalised grow plan
          </Text>
          <View style={styles.cropsGrid}>
            {recommendedCrops.map(crop => (
              <Pressable
                key={crop}
                style={({ pressed }) => [
                  styles.cropChip,
                  {
                    backgroundColor: selectedCrop === crop ? colors.primary : colors.card,
                    borderColor: selectedCrop === crop ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={() => {
                  setSelectedCrop(prev => prev === crop ? null : crop);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[
                  styles.cropChipText,
                  { color: selectedCrop === crop ? "#FFF" : colors.foreground },
                ]}>
                  {crop}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedCrop && (
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                { backgroundColor: generating ? colors.mutedForeground : colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={generatePlan}
              disabled={generating}
            >
              {generating ? (
                <View style={styles.genRow}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.generateBtnText}>Generating Plan...</Text>
                </View>
              ) : (
                <View style={styles.genRow}>
                  <MaterialCommunityIcons name="calendar-star" size={20} color="#FFF" />
                  <Text style={styles.generateBtnText}>Generate Grow Plan for {selectedCrop}</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* Saved Plans */}
      {plans.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Grow Plans</Text>
          {plans.map(plan => (
            <Pressable
              key={plan.id}
              style={({ pressed }) => [
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push({ pathname: "/grow-plan/[id]", params: { id: plan.id } })}
            >
              <View style={styles.planCardRow}>
                <View style={[styles.planIcon, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name="sprout" size={22} color={colors.primary} />
                </View>
                <View style={styles.planInfo}>
                  <Text style={[styles.planCrop, { color: colors.foreground }]}>{plan.cropName}</Text>
                  <Text style={[styles.planMeta, { color: colors.mutedForeground }]}>
                    {plan.location} · {plan.season} · {plan.totalDays} days
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },

  moonCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  moonLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  moonEmoji: { fontSize: 40 },
  moonPhaseName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  moonIllum: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  moonAdviceBubble: { borderRadius: 10, padding: 12 },
  moonAdviceText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 20 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },

  eventsRow: { flexDirection: "row", gap: 8 },
  eventCard: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    padding: 10, alignItems: "center", gap: 4,
  },
  eventEmoji: { fontSize: 22 },
  eventName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  eventDate: { fontSize: 11, fontFamily: "Inter_400Regular" },

  locationCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  locationInfo: { flex: 1 },
  locationName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  locationSeason: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  seasonDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  locationButtons: { gap: 10 },
  locBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 16, borderRadius: 14,
  },
  locBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  locBtnOutline: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  locBtnOutlineText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  manualCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  manualLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  manualInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  manualBtns: { flexDirection: "row", gap: 10, alignItems: "center" },
  manualSaveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  manualSaveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  manualCancelBtn: { padding: 10 },
  manualCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  cropsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  cropChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  cropChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  generateBtn: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
  genRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  generateBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#FFF" },

  planCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  planCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  planInfo: { flex: 1 },
  planCrop: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  planMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
