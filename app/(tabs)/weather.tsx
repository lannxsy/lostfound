import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// ... (Type & Constant API tetap sama)

export default function WeatherScreen() {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('Bandung');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);

  const fetchWeather = async () => {
    const city = query.trim();
    if (!city) {
      Alert.alert('Access Denied', 'Target location required.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=ace748b92ef04dabbdf232232243009&q=${encodeURIComponent(city)}&aqi=no`;
      const response = await fetch(url);
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? 'Signal lost.');
      setWeather(json);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'System Failure');
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="umbrella" size={32} color="#ef4444" />
          <ThemedText type="title" style={styles.mainTitle}>ENV. MONITOR</ThemedText>
        </View>

        <View style={styles.searchSection}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Target City..."
            placeholderTextColor="#94a3b8"
            style={[styles.input, { 
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: '#ef4444' 
            }]}
            onSubmitEditing={fetchWeather}
          />
          <Pressable style={styles.searchButton} onPress={fetchWeather} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Ionicons name="scan" size={24} color="#fff" />}
          </Pressable>
        </View>

        {weather && (
          <View style={styles.displayWrapper}>
            <View style={styles.locationHeader}>
              <ThemedText style={styles.cityName}>{weather.location.name.toUpperCase()}</ThemedText>
              <ThemedText style={styles.countryName}>COORDINATES: {weather.location.country}</ThemedText>
            </View>

            {/* Bagian yang dibenerin biar gak kepotong */}
            <View style={styles.visualContainer}>
              <Image
                source={{ uri: `https:${weather.current.condition.icon}` }}
                style={styles.weatherIcon}
                resizeMode="contain"
              />
              <View style={styles.tempWrapper}>
                <ThemedText style={styles.tempBig}>{Math.round(weather.current.temp_c)}°</ThemedText>
                <ThemedText style={styles.unitText}>C</ThemedText>
              </View>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.conditionDesc}>{weather.current.condition.text.toUpperCase()}</ThemedText>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: 'Thermal', value: `${weather.current.feelslike_c}°C`, icon: 'thermometer' },
                { label: 'Humidity', value: `${weather.current.humidity}%`, icon: 'water' },
                { label: 'Wind', value: `${weather.current.wind_kph} KPH`, icon: 'airplane' },
                { label: 'UV Index', value: weather.current.uv, icon: 'sunny' },
              ].map((item, index) => (
                <View key={index} style={[styles.statItem, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
                  <Ionicons name={item.icon as any} size={16} color="#ef4444" />
                  <ThemedText style={styles.statLabel}>{item.label}</ThemedText>
                  <ThemedText style={styles.statValue}>{item.value}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        <ThemedText style={styles.footerText}>
          SECURE PROTOCOL ACTIVE // OPS: HARLAN ARIA PRATAMA
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 60, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 },
  mainTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  searchSection: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  input: { flex: 1, height: 50, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1.5, fontWeight: '700' },
  searchButton: { backgroundColor: '#ef4444', width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  displayWrapper: { width: '100%', alignItems: 'center' },
  locationHeader: { alignItems: 'center', marginBottom: 15 },
  cityName: { fontSize: 28, fontWeight: '900', color: '#ef4444', textAlign: 'center' },
  countryName: { fontSize: 10, fontWeight: '700', opacity: 0.5, letterSpacing: 1 },
  visualContainer: { width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 25, padding: 20, alignItems: 'center', marginBottom: 20 },
  weatherIcon: { width: 80, height: 80 },
  tempWrapper: { flexDirection: 'row', alignItems: 'flex-start' },
  tempBig: { fontSize: 72, fontWeight: '200', color: '#ef4444', lineHeight: 80 },
  unitText: { fontSize: 24, fontWeight: '800', color: '#ef4444', marginTop: 15 },
  statusBadge: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 5 },
  conditionDesc: { fontSize: 12, fontWeight: '900', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', width: '100%' },
  statItem: { width: '48%', padding: 12, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: '#ef4444', elevation: 2 },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '900' },
  footerText: { textAlign: 'center', fontSize: 9, color: '#94a3b8', marginTop: 30, fontWeight: '800', letterSpacing: 1 },
});