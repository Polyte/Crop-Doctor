import { useMarket } from "@/context/MarketContext";
import { useColors } from "@/hooks/useColors";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = ["Crops", "Vegetables", "Fruits", "Livestock", "Dairy", "Honey", "Herbs", "Other"];

const UNITS = ["kg", "g", "litre", "ml", "bunch", "piece", "bag (50kg)", "tray", "crate", "dozen"];

const CATEGORY_ICONS: Record<string, string> = {
  Crops: "grain",
  Vegetables: "food-apple-outline",
  Fruits: "fruit-cherries",
  Livestock: "cow",
  Dairy: "cup",
  Honey: "bee",
  Herbs: "leaf",
  Other: "dots-horizontal",
};

export default function AddListingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addListing, farmerProfile } = useMarket();

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!productName.trim()) { Alert.alert("Missing field", "Please enter a product name."); return; }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) { Alert.alert("Invalid price", "Please enter a valid price."); return; }
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) { Alert.alert("Invalid quantity", "Please enter a valid quantity."); return; }
    if (!farmerProfile) { Alert.alert("Not registered", "Please register as a farmer first."); return; }

    setLoading(true);
    try {
      await addListing({
        productName: productName.trim(),
        category,
        price: parseFloat(price),
        unit,
        quantity: parseFloat(quantity),
        description: description.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to add listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Product</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Product name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Product Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Fresh Tomatoes"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Category *</Text>
          <View style={styles.pillGrid}>
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
                  size={16}
                  color={category === c ? "#fff" : colors.mutedForeground}
                />
                <Text style={[styles.catPillText, { color: category === c ? "#fff" : colors.foreground }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Price + Unit side by side */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Price (KSh) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 50"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Per Unit *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitPill,
                      {
                        backgroundColor: unit === u ? colors.primary : colors.card,
                        borderColor: unit === u ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setUnit(u); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.unitText, { color: unit === u ? "#fff" : colors.foreground }]}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Quantity available */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Quantity Available *</Text>
          <View style={[styles.inputWithUnit, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputInner, { color: colors.foreground }]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g. 200"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
            <Text style={[styles.unitSuffix, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>{unit}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product — freshness, organic, harvested when, etc."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Preview card */}
        {productName.trim() && price ? (
          <View style={[styles.preview, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Preview</Text>
            <View style={styles.previewRow}>
              <View style={[styles.previewIcon, { backgroundColor: colors.primary + "22" }]}>
                <MaterialCommunityIcons name={CATEGORY_ICONS[category] as never} size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewName, { color: colors.foreground }]}>{productName}</Text>
                <Text style={[styles.previewPrice, { color: colors.primary }]}>
                  KSh {parseFloat(price || "0").toLocaleString()}/{unit}
                </Text>
                {quantity ? (
                  <Text style={[styles.previewQty, { color: colors.mutedForeground }]}>
                    {quantity} {unit} available
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="package-variant-plus" size={20} color="#fff" />
              <Text style={styles.submitText}>List Product</Text>
            </>
          )}
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 20 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { height: 96, textAlignVertical: "top" },
  pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  catPillText: { fontSize: 13, fontWeight: "500" },
  unitPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  unitText: { fontSize: 13, fontWeight: "500" },
  inputWithUnit: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  inputInner: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  unitSuffix: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: "600" },
  preview: { marginTop: 20, borderRadius: 16, borderWidth: 1, padding: 16 },
  previewLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", marginBottom: 10 },
  previewRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  previewIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  previewName: { fontSize: 16, fontWeight: "700" },
  previewPrice: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  previewQty: { fontSize: 12, marginTop: 2 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 24 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
