import { useWeather } from "@/context/WeatherContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function WeatherWidget() {
  const colors = useColors();
  const { weather, loading, error, refresh } = useWeather();

  if (loading && !weather) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <Pressable onPress={refresh} style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="cloud-off" size={20} color={colors.mutedForeground} />
        <Text style={[styles.error, { color: colors.mutedForeground }]}>
          {error || "Weather unavailable"}
        </Text>
        <Text style={[styles.retry, { color: colors.primary }]}>Tap to retry</Text>
      </Pressable>
    );
  }

  const getIcon = (name: string) => {
    const map: Record<string, string> = {
      "sun": "sun",
      "cloud-sun": "cloud",
      "cloud": "cloud",
      "cloud-rain": "cloud-rain",
      "cloud-showers-heavy": "cloud-rain",
      "snowflake": "cloud-snow",
      "bolt": "zap",
      "fog": "cloud",
    };
    return map[name] ?? "cloud";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.mainInfo}>
          <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
            <Feather name={getIcon(weather.icon) as never} size={28} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.temp, { color: colors.foreground }]}>{weather.temp}°C</Text>
            <Text style={[styles.condition, { color: colors.mutedForeground }]}>{weather.condition}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Feather name="droplet" size={12} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="wind" size={12} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{weather.windSpeed} km/h</Text>
          </View>
          <View style={styles.detailRow}>
            <Feather name="cloud-rain" size={12} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{weather.rainChance}%</Text>
          </View>
        </View>
      </View>

      {/* Farming advice */}
      {weather.farmingAdvice && (
        <View style={[styles.adviceBox, { backgroundColor: colors.secondary }]}>
          <Feather name="sun" size={14} color={colors.primary} />
          <Text style={[styles.advice, { color: colors.primary }]}>{weather.farmingAdvice}</Text>
        </View>
      )}

      {/* 4-day forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <View style={styles.forecastRow}>
          {weather.forecast.map((f, i) => (
            <View key={i} style={styles.forecastItem}>
              <Text style={[styles.forecastDay, { color: colors.mutedForeground }]}>{f.day}</Text>
              <Feather name={getIcon(f.icon) as never} size={14} color={colors.mutedForeground} />
              <Text style={[styles.forecastTemp, { color: colors.foreground }]}>{f.temp}°</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  temp: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  condition: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  details: {
    gap: 4,
    alignItems: "flex-end",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  adviceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
  },
  advice: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 18,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingTop: 10,
  },
  forecastItem: {
    alignItems: "center",
    gap: 4,
  },
  forecastDay: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  forecastTemp: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  retry: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});
