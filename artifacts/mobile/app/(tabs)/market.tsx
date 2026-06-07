import Head from "expo-router/head";
import { useMarket, type FarmerProfile, type ListingWithFarmer, type Listing } from "@/context/MarketContext";
import { usePriceAlerts } from "@/context/PriceAlertsContext";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const CATEGORIES = ["All", "Crops", "Vegetables", "Fruits", "Livestock", "Dairy", "Honey", "Herbs", "Other"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "view-grid",
  Crops: "grain",
  Vegetables: "food-apple-outline",
  Fruits: "fruit-cherries",
  Livestock: "cow",
  Dairy: "cup",
  Honey: "bee",
  Herbs: "leaf",
  Other: "dots-horizontal",
};

const CATEGORY_COLORS: Record<string, string> = {
  Crops: "#E9C46A",
  Vegetables: "#52B788",
  Fruits: "#F4A261",
  Livestock: "#BC8F5F",
  Dairy: "#AEE6F0",
  Honey: "#F9C74F",
  Herbs: "#90BE6D",
  Other: "#B5B5B5",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#B5B5B5";
}

function formatPrice(price: number, unit: string) {
  return `KSh ${price.toLocaleString()}/${unit}`;
}

// ─── Listing Card (shop view) ────────────────────────────────────────────────
function ListingCard({
  item,
  colors,
  onPress,
}: {
  item: ListingWithFarmer;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const catColor = getCategoryColor(item.category);
  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={[styles.cardImagePlaceholder, { backgroundColor: catColor + "33" }]}>
        <MaterialCommunityIcons
          name={CATEGORY_ICONS[item.category] as never ?? "leaf"}
          size={36}
          color={catColor}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + "22" }]}>
          <Text style={[styles.categoryBadgeText, { color: catColor }]}>{item.category}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {item.productName}
        </Text>
        <Text style={[styles.cardPrice, { color: colors.primary }]}>{formatPrice(item.price, item.unit)}</Text>
        <Text style={[styles.cardQty, { color: colors.mutedForeground }]}>
          {item.quantity} {item.unit} available
        </Text>
        <View style={styles.cardFarmer}>
          <MaterialCommunityIcons name="account-circle-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.cardFarmerText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.farmName ?? item.farmerName ?? "Farmer"} · {item.farmerLocation ?? ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Listing Detail Modal ─────────────────────────────────────────────────────
function ListingDetailModal({
  item,
  visible,
  onClose,
  colors,
}: {
  item: ListingWithFarmer | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const { isWatching, watchListing, unwatchListing } = usePriceAlerts();
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");

  if (!item) return null;
  const catColor = getCategoryColor(item.category);
  const watching = isWatching(item.id);

  const handleCall = () => {
    if (!item.farmerPhone) return;
    Alert.alert("Contact Farmer", `Call ${item.farmerName ?? "Farmer"} at ${item.farmerPhone}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => {
          const { Linking } = require("react-native");
          Linking.openURL(`tel:${item.farmerPhone}`);
        },
      },
    ]);
  };

  const handleWhatsApp = () => {
    if (!item.farmerPhone) return;
    const { Linking } = require("react-native");
    const num = item.farmerPhone.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/${num}?text=Hi, I'm interested in your ${item.productName} on Farmguard Market.`);
  };

  const handleWatchToggle = async () => {
    if (watching) {
      await unwatchListing(item.id);
      Alert.alert("Removed", `Price alert for ${item.productName} has been removed.`);
    } else {
      setTargetPrice(String(Math.round(item.price * 0.9)));
      setShowPriceInput(true);
    }
  };

  const confirmWatch = async () => {
    const tp = parseFloat(targetPrice);
    if (isNaN(tp) || tp <= 0) { Alert.alert("Invalid", "Enter a valid target price."); return; }
    await watchListing(item.id, item.productName, item.price, tp);
    setShowPriceInput(false);
    Alert.alert("Watching!", `You'll be notified when ${item.productName} drops to KSh ${tp.toLocaleString()} or below.`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

        {/* Hero */}
        <View style={[styles.detailHero, { backgroundColor: catColor + "22" }]}>
          <MaterialCommunityIcons name={CATEGORY_ICONS[item.category] as never ?? "leaf"} size={72} color={catColor} />
        </View>

        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Title row */}
          <View style={styles.detailTitleRow}>
            <View style={{ flex: 1 }}>
              <View style={[styles.categoryBadge, { backgroundColor: catColor + "22", alignSelf: "flex-start" }]}>
                <Text style={[styles.categoryBadgeText, { color: catColor }]}>{item.category}</Text>
              </View>
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>{item.productName}</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Price + qty */}
          <View style={[styles.priceRow, { backgroundColor: colors.secondary }]}>
            <View style={styles.priceCol}>
              <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Price</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                KSh {item.price.toLocaleString()}
              </Text>
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>per {item.unit}</Text>
            </View>
            <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
            <View style={styles.priceCol}>
              <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Available</Text>
              <Text style={[styles.priceValue, { color: colors.foreground }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}>{item.unit}</Text>
            </View>
          </View>

          {/* Price alert input */}
          {showPriceInput && (
            <View style={[styles.alertBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.alertLabel, { color: colors.foreground }]}>Notify me when price drops to:</Text>
              <View style={styles.alertInputRow}>
                <Text style={[styles.alertCurrency, { color: colors.mutedForeground }]}>KSh</Text>
                <TextInput
                  style={[styles.alertInput, { color: colors.foreground, borderColor: colors.border }]}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  keyboardType="numeric"
                  placeholder="Target price"
                  placeholderTextColor={colors.mutedForeground}
                />
                <Pressable style={[styles.alertConfirm, { backgroundColor: colors.primary }]} onPress={confirmWatch}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Set Alert</Text>
                </Pressable>
              </View>
            </View>
          )}

          {item.description ? (
            <View style={styles.detailSection}>
              <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Description</Text>
              <Text style={[styles.detailDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
          ) : null}

          {/* Farmer card */}
          <View style={[styles.farmerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.farmerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.farmerAvatarText}>
                {(item.farmerName ?? "F").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.farmerCardName, { color: colors.foreground }]}>
                {item.farmName ?? item.farmerName}
              </Text>
              <Text style={[styles.farmerCardSub, { color: colors.mutedForeground }]}>
                {item.farmerName}{item.farmerLocation ? ` · ${item.farmerLocation}` : ""}
              </Text>
            </View>
          </View>

          {/* CTA buttons */}
          <View style={styles.ctaRow}>
            <Pressable
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              onPress={handleCall}
            >
              <Feather name="phone" size={18} color="#fff" />
              <Text style={styles.ctaBtnText}>Call Farmer</Text>
            </Pressable>
            <Pressable
              style={[styles.ctaBtnOutline, { borderColor: "#25D366" }]}
              onPress={handleWhatsApp}
            >
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              <Text style={[styles.ctaBtnOutlineText, { color: "#25D366" }]}>WhatsApp</Text>
            </Pressable>
          </View>

          {/* Watch price button */}
          <Pressable
            style={[styles.watchBtn, { borderColor: watching ? colors.destructive : colors.border, backgroundColor: watching ? colors.destructive + "12" : colors.card }]}
            onPress={handleWatchToggle}
          >
            <MaterialCommunityIcons name={watching ? "bell-off-outline" : "bell-plus-outline"} size={18} color={watching ? colors.destructive : colors.mutedForeground} />
            <Text style={[styles.watchBtnText, { color: watching ? colors.destructive : colors.mutedForeground }]}>
              {watching ? "Remove Price Alert" : "Set Price Alert"}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── My Farm tab ─────────────────────────────────────────────────────────────
function MyFarmView({
  colors,
  profile,
  listings,
  loadingListings,
  onRegister,
  onEditProfile,
  onAddListing,
  onToggle,
  onDelete,
  onRefresh,
}: {
  colors: ReturnType<typeof useColors>;
  profile: FarmerProfile | null;
  listings: Listing[];
  loadingListings: boolean;
  onRegister: () => void;
  onEditProfile: () => void;
  onAddListing: () => void;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  if (!profile) {
    return (
      <View style={styles.registerCta}>
        <View style={[styles.registerIcon, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="storefront-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.registerTitle, { color: colors.foreground }]}>Sell on Farmguard Market</Text>
        <Text style={[styles.registerSub, { color: colors.mutedForeground }]}>
          Register your farm and start listing your fresh produce, livestock, and more to reach buyers near you.
        </Text>
        <Pressable style={[styles.registerBtn, { backgroundColor: colors.primary }]} onPress={onRegister}>
          <MaterialCommunityIcons name="storefront-plus-outline" size={20} color="#fff" />
          <Text style={styles.registerBtnText}>Register as Farmer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.profileCardLeft}>
          <View style={[styles.profileAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={styles.profileAvatarText}>{profile.farmName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileFarmName}>{profile.farmName}</Text>
            <Text style={styles.profileSub}>{profile.name} · {profile.location}</Text>
          </View>
        </View>
        <Pressable style={styles.profileEditBtn} onPress={onEditProfile}>
          <Feather name="edit-2" size={16} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{listings.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Listings</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {listings.filter((l) => l.available).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Available</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {listings.filter((l) => !l.available).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Paused</Text>
        </View>
      </View>

      {/* Listings */}
      <View style={[styles.myListingsHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.myListingsTitle, { color: colors.foreground }]}>My Products</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={onAddListing}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Product</Text>
        </Pressable>
      </View>

      {loadingListings ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : listings.length === 0 ? (
        <View style={styles.emptyListings}>
          <MaterialCommunityIcons name="package-variant-plus" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyListingsText, { color: colors.mutedForeground }]}>
            No products yet. Add your first listing!
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={styles.myListingsList}
          refreshControl={
            <RefreshControl refreshing={loadingListings} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.myListingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.myListingIcon, { backgroundColor: getCategoryColor(item.category) + "22" }]}>
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[item.category] as never ?? "leaf"}
                  size={24}
                  color={getCategoryColor(item.category)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.myListingName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={[styles.myListingPrice, { color: colors.mutedForeground }]}>
                  KSh {item.price}/{item.unit} · {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.myListingActions}>
                <Pressable
                  style={[
                    styles.availBadge,
                    { backgroundColor: item.available ? "#D8F3DC" : "#FFE5E5" },
                  ]}
                  onPress={() => onToggle(item.id, item.available)}
                >
                  <Text style={[styles.availText, { color: item.available ? "#2D6A4F" : "#D62828" }]}>
                    {item.available ? "Live" : "Paused"}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Registration / Edit Modal ────────────────────────────────────────────────
function FarmerFormModal({
  visible,
  initial,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  initial: Partial<FarmerProfile> | null;
  onClose: () => void;
  onSubmit: (data: { name: string; farmName: string; location: string; phone: string; bio: string }) => Promise<void>;
  colors: ReturnType<typeof useColors>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [farmName, setFarmName] = useState(initial?.farmName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setFarmName(initial?.farmName ?? "");
      setLocation(initial?.location ?? "");
      setPhone(initial?.phone ?? "");
      setBio(initial?.bio ?? "");
    }
  }, [visible, initial]);

  const handleSubmit = async () => {
    if (!name.trim() || !farmName.trim() || !location.trim() || !phone.trim()) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ name, farmName, location, phone, bio });
      onClose();
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <View style={styles.formHeader}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {initial?.id ? "Edit Profile" : "Register Your Farm"}
          </Text>
          <Pressable onPress={onClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
          {[
            { label: "Your Name *", value: name, set: setName, placeholder: "e.g. Jane Mwangi", keyboard: "default" as const },
            { label: "Farm Name *", value: farmName, set: setFarmName, placeholder: "e.g. Green Acres Farm" },
            { label: "Location *", value: location, set: setLocation, placeholder: "e.g. Nakuru, Kenya" },
            { label: "Phone Number *", value: phone, set: setPhone, placeholder: "e.g. 0712345678", keyboard: "phone-pad" as const },
          ].map((f) => (
            <View key={f.label} style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>{f.label}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={f.value}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={colors.mutedForeground}
                keyboardType={f.keyboard}
              />
            </View>
          ))}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Bio (optional)</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Briefly describe your farm..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
            />
          </View>
          <Pressable
            style={[styles.formSubmitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.formSubmitText}>{initial?.id ? "Save Changes" : "Register Farm"}</Text>
            )}
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MarketScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { farmerProfile, myListings, loadingProfile, loadingMyListings, registerFarmer, refreshMyListings, toggleAvailability, deleteListing } = useMarket();

  const [activeTab, setActiveTab] = useState<"shop" | "farm">("shop");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [shopListings, setShopListings] = useState<ListingWithFarmer[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingWithFarmer | null>(null);
  const [showFarmerForm, setShowFarmerForm] = useState(false);

  const fetchShopListings = useCallback(async () => {
    setLoadingShop(true);
    try {
      const res = await fetch(`${API_BASE}/market/listings`);
      if (res.ok) setShopListings(await res.json());
    } finally {
      setLoadingShop(false);
    }
  }, []);

  const onRefreshShop = useCallback(async () => {
    setRefreshing(true);
    await fetchShopListings();
    setRefreshing(false);
  }, [fetchShopListings]);

  useEffect(() => {
    fetchShopListings();
  }, [fetchShopListings]);

  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

  const filteredListings = shopListings.filter((l) => {
    const matchCat = category === "All" || l.category === category;
    const matchSearch =
      !search ||
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      (l.farmerLocation ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (l.farmName ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return (new Date(b.createdAt ?? 0).getTime() || 0) - (new Date(a.createdAt ?? 0).getTime() || 0);
  });

  const handleDeleteListing = (id: number) => {
    Alert.alert("Delete Listing", "Are you sure you want to remove this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteListing(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Head>
        <title>Farmers Market — Farmguard</title>
        <meta name="description" content="Buy fresh produce, crops, dairy, and livestock directly from local farmers. Register your farm to list and sell your products on Farmguard Market." />
      </Head>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Farmguard Market</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Fresh produce, direct from farmers
          </Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} style={{ padding: 8 }}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Tab toggle */}
      <View style={[styles.tabToggle, { backgroundColor: colors.muted }]}>
        {(["shop", "farm"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tabToggleBtn, activeTab === t && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
            onPress={() => { setActiveTab(t); Haptics.selectionAsync(); }}
          >
            <MaterialCommunityIcons
              name={t === "shop" ? "shopping-outline" : "tractor"}
              size={16}
              color={activeTab === t ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.tabToggleText, { color: activeTab === t ? colors.primary : colors.mutedForeground, fontWeight: activeTab === t ? "600" : "400" }]}>
              {t === "shop" ? "Shop" : "My Farm"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── SHOP TAB ── */}
      {activeTab === "shop" && (
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search produce, location..."
              placeholderTextColor={colors.mutedForeground}
            />
            {search ? (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          {/* Sort by */}
          <View style={styles.sortRow}>
            {(["newest", "price-low", "price-high"] as const).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.sortPill,
                  {
                    backgroundColor: sortBy === s ? colors.primary : colors.card,
                    borderColor: sortBy === s ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setSortBy(s); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.sortPillText, { color: sortBy === s ? "#fff" : colors.foreground }]}>
                  {s === "newest" ? "Newest" : s === "price-low" ? "Price: Low" : "Price: High"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Category pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: category === c ? colors.primary : colors.card,
                    borderColor: category === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setCategory(c); Haptics.selectionAsync(); }}
              >
                <MaterialCommunityIcons
                  name={CATEGORY_ICONS[c] as never}
                  size={14}
                  color={category === c ? "#fff" : colors.mutedForeground}
                />
                <Text style={[styles.catPillText, { color: category === c ? "#fff" : colors.foreground }]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loadingShop ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
          ) : filteredListings.length === 0 ? (
            <View style={styles.emptyShop}>
              <MaterialCommunityIcons name="basket-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyShopText, { color: colors.mutedForeground }]}>
                {search || category !== "All" ? "No listings match your filters." : "No listings yet. Be the first to sell!"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredListings}
              keyExtractor={(l) => String(l.id)}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefreshShop} tintColor={colors.primary} />
              }
              renderItem={({ item }) => (
                <ListingCard
                  item={item}
                  colors={colors}
                  onPress={() => { setSelectedListing(item); Haptics.selectionAsync(); }}
                />
              )}
            />
          )}
        </View>
      )}

      {/* ── MY FARM TAB ── */}
      {activeTab === "farm" && (
        <View style={{ flex: 1 }}>
          {loadingProfile ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
          ) : (
            <MyFarmView
              colors={colors}
              profile={farmerProfile}
              listings={myListings}
              loadingListings={loadingMyListings}
              onRegister={() => setShowFarmerForm(true)}
              onEditProfile={() => setShowFarmerForm(true)}
              onAddListing={() => router.push("/market/add-listing")}
              onToggle={toggleAvailability}
              onDelete={handleDeleteListing}
              onRefresh={refreshMyListings}
            />
          )}
        </View>
      )}

      {/* Listing detail modal */}
      <ListingDetailModal
        item={selectedListing}
        visible={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        colors={colors}
      />

      {/* Farmer registration / edit modal */}
      <FarmerFormModal
        visible={showFarmerForm}
        initial={farmerProfile}
        onClose={() => setShowFarmerForm(false)}
        onSubmit={registerFarmer}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },
  tabToggle: { flexDirection: "row", marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 12 },
  tabToggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabToggleText: { fontSize: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  catScroll: { maxHeight: 44, marginBottom: 8 },
  catContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  catPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 13, fontWeight: "500" },
  gridRow: { gap: 12, paddingHorizontal: 20 },
  gridContent: { paddingBottom: 100, paddingTop: 8, gap: 12 },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardImagePlaceholder: { height: 90, alignItems: "center", justifyContent: "center" },
  cardBody: { padding: 12, gap: 4 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 2 },
  categoryBadgeText: { fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  cardTitle: { fontSize: 14, fontWeight: "600", lineHeight: 18 },
  cardPrice: { fontSize: 14, fontWeight: "700" },
  cardQty: { fontSize: 11 },
  cardFarmer: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardFarmerText: { fontSize: 11, flex: 1 },
  emptyShop: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyShopText: { fontSize: 14, textAlign: "center" },
  // Detail modal
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  modalScroll: { flex: 1 },
  detailHero: { height: 140, alignItems: "center", justifyContent: "center" },
  detailTitleRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  detailTitle: { fontSize: 22, fontWeight: "700", marginTop: 6 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  priceRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16 },
  priceCol: { flex: 1, alignItems: "center", gap: 2 },
  priceDivider: { width: 1, marginVertical: 4 },
  priceLabel: { fontSize: 12 },
  priceValue: { fontSize: 24, fontWeight: "700" },
  priceUnit: { fontSize: 12 },
  detailSection: { paddingHorizontal: 20, marginTop: 16 },
  detailSectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  detailDesc: { fontSize: 14, lineHeight: 20 },
  farmerCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  farmerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  farmerAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  farmerCardName: { fontSize: 15, fontWeight: "600" },
  farmerCardSub: { fontSize: 13, marginTop: 2 },
  ctaRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginTop: 20 },
  ctaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  ctaBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  ctaBtnOutline: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 2 },
  ctaBtnOutlineText: { fontWeight: "600", fontSize: 15 },
  watchBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, marginHorizontal: 20, marginTop: 10 },
  watchBtnText: { fontWeight: "600", fontSize: 14 },
  alertBox: { marginHorizontal: 20, marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  alertLabel: { fontSize: 13, fontWeight: "600" },
  alertInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertCurrency: { fontSize: 14, fontWeight: "600" },
  alertInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  alertConfirm: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  sortRow: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 10 },
  sortPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  sortPillText: { fontSize: 12, fontWeight: "500" },
  // My Farm
  registerCta: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  registerIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  registerTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  registerSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  registerBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  registerBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  profileCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 4, marginBottom: 12, padding: 16, borderRadius: 16 },
  profileCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileFarmName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  profileSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  profileEditBtn: { padding: 8 },
  statsRow: { flexDirection: "row", marginHorizontal: 20, borderRadius: 12, borderWidth: 1, marginBottom: 16, paddingVertical: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  myListingsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 4 },
  myListingsTitle: { fontSize: 16, fontWeight: "600" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  myListingsList: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100, gap: 10 },
  myListingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  myListingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  myListingName: { fontSize: 14, fontWeight: "600" },
  myListingPrice: { fontSize: 12, marginTop: 2 },
  myListingActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  availText: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyListings: { alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  emptyListingsText: { fontSize: 14, textAlign: "center" },
  // Farmer form
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  formTitle: { fontSize: 20, fontWeight: "700" },
  formScroll: { flex: 1, paddingHorizontal: 20 },
  formField: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  formTextarea: { height: 80, textAlignVertical: "top" },
  formSubmitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  formSubmitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
