import { useLandPlanner, type AgroStore } from "@/context/LandPlannerContext";
import { useLocation } from "@/context/LocationContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = ["All", "Seeds", "Fertilizers", "Pesticides", "Tools", "General"];

const CAT_ICONS: Record<string, string> = {
  All: "store-search-outline",
  Seeds: "seed",
  Fertilizers: "spray",
  Pesticides: "bug",
  Tools: "tools",
  General: "storefront-outline",
};

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function StoresScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getStores } = useLandPlanner();
  const { location } = useLocation();

  const [stores, setStores] = useState<AgroStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [radiusKm, setRadiusKm] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const loadStores = useCallback(async () => {
    if (!location?.latitude || !location?.longitude) {
      setError("Location not available. Please set your location in the Planner tab.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cat = category === "All" ? undefined : category.toLowerCase();
      const rows = await getStores(location.latitude, location.longitude, cat, radiusKm);
      setStores(rows);
    } catch {
      setError("Could not load nearby stores.");
    } finally { setLoading(false); }
  }, [location, category, radiusKm, getStores]);

  useEffect(() => { loadStores(); }, [loadStores]);

  const filtered = stores;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nearby Agro Stores</Text>
        <Pressable onPress={() => setShowMap(!showMap)} style={styles.backBtn}>
          <Feather name={showMap ? "list" : "map"} size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.catPill, {
              backgroundColor: category === c ? colors.primary : colors.card,
              borderColor: category === c ? colors.primary : colors.border,
            }]}
            onPress={() => { setCategory(c); Haptics.selectionAsync(); }}
          >
            <MaterialCommunityIcons name={CAT_ICONS[c] as never} size={14} color={category === c ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.catText, { color: category === c ? "#fff" : colors.foreground }]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Radius filter */}
      <View style={styles.radiusRow}>
        <Text style={[styles.radiusLabel, { color: colors.mutedForeground }]}>Within</Text>
        {RADIUS_OPTIONS.map((r) => (
          <Pressable
            key={r}
            style={[styles.radiusPill, {
              backgroundColor: radiusKm === r ? colors.primary : colors.card,
              borderColor: radiusKm === r ? colors.primary : colors.border,
            }]}
            onPress={() => { setRadiusKm(r); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.radiusText, { color: radiusKm === r ? "#fff" : colors.foreground }]}>{r} km</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.errorCenter}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={loadStores}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.errorCenter}>
          <MaterialCommunityIcons name="store-off-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>No agro stores found nearby.</Text>
        </View>
      ) : showMap ? (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location!.latitude,
              longitude: location!.longitude,
              latitudeDelta: radiusKm / 55,
              longitudeDelta: radiusKm / 55,
            }}
          >
            <Marker
              coordinate={{ latitude: location!.latitude, longitude: location!.longitude }}
              title="You"
              pinColor={colors.primary}
            />
            {filtered.map((s) => (
              <Marker
                key={String(s.id)}
                coordinate={{ latitude: s.lat, longitude: s.lon }}
                title={s.name}
                description={`${s.category} · ${formatDistance(s.distance)}`}
              >
                <View style={[styles.mapPin, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name={CAT_ICONS[s.category] as never ?? "storefront-outline"} size={14} color={colors.primary} />
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={[styles.mapOverlay, { backgroundColor: colors.background }]}>
            <Text style={[styles.mapOverlayText, { color: colors.foreground }]}>{filtered.length} store{filtered.length !== 1 ? "s" : ""} nearby</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.storeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.storeHeader}>
                <View style={[styles.storeIcon, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name={CAT_ICONS[item.category] as never ?? "storefront-outline"} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.storeCat, { color: colors.mutedForeground }]}>{item.category} · {item.city}</Text>
                </View>
                <View style={[styles.distBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.distText, { color: colors.primary }]}>{formatDistance(item.distance)}</Text>
                </View>
              </View>
              <Text style={[styles.storeAddress, { color: colors.mutedForeground }]}>{item.address}</Text>
              {item.products ? <Text style={[styles.storeProducts, { color: colors.mutedForeground }]}>Products: {item.products}</Text> : null}
              <View style={styles.storeActions}>
                <Pressable style={[styles.storeBtn, { backgroundColor: colors.primary }]} onPress={() => {
                  if (item.phone) Linking.openURL(`tel:${item.phone}`);
                }}>
                  <Feather name="phone" size={14} color="#fff" />
                  <Text style={styles.storeBtnText}>Call</Text>
                </Pressable>
                <Pressable style={[styles.storeBtnOutline, { borderColor: colors.primary }]} onPress={() => {
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`);
                }}>
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <Text style={[styles.storeBtnOutlineText, { color: colors.primary }]}>Open Map</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 8 },
  catScroll: { maxHeight: 48, marginTop: 12, marginBottom: 4 },
  catContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontWeight: "500" },
  radiusRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  radiusLabel: { fontSize: 13, fontWeight: "500" },
  radiusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  radiusText: { fontSize: 12, fontWeight: "600" },
  errorCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12, paddingTop: 4 },
  mapWrap: { flex: 1, position: "relative" },
  map: { flex: 1 },
  mapPin: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  mapOverlay: { position: "absolute", bottom: 16, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, opacity: 0.95 },
  mapOverlayText: { fontSize: 13, fontWeight: "600" },
  storeCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  storeHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  storeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  storeName: { fontSize: 15, fontWeight: "600" },
  storeCat: { fontSize: 12, marginTop: 1 },
  distBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  distText: { fontSize: 12, fontWeight: "600" },
  storeAddress: { fontSize: 13, lineHeight: 18 },
  storeProducts: { fontSize: 12, fontStyle: "italic" },
  storeActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  storeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  storeBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  storeBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5 },
  storeBtnOutlineText: { fontWeight: "600", fontSize: 13 },
});
