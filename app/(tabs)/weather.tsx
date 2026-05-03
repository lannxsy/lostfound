import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  useColorScheme,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type WeatherApiResponse = {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    wind_dir: string;
    uv: number;
    condition: {
      text: string;
      icon: string;
    };
  };
};

const API_KEY = 'ace748b92ef04dabbdf232232243009';
const BASE_URL = 'https://api.weatherapi.com/v1/current.json';

export default function WeatherScreen() {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('Bandung');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);

  const fetchWeather = async () => {
    const city = query.trim();
    if (!city) {
      Alert.alert('Input required', 'Masukkan nama kota dulu ya.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error?.message ?? 'Gagal mengambil data.');
      }

      setWeather(json as WeatherApiResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Search Bar - Dibuat lebih lebar dan kontras */}
        <View style={styles.searchSection}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari Kota..."
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#f8fafc' : '#0f172a',
                borderColor: isDark ? '#334155' : '#e2e8f0'
              }
            ]}
            onSubmitEditing={fetchWeather}
          />
          <Pressable style={styles.searchButton} onPress={fetchWeather} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>Cari</ThemedText>
            )}
          </Pressable>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        )}

        {weather && (
          <View style={styles.mainDisplay}>
            <ThemedText style={styles.cityName}>{weather.location.name}</ThemedText>
            <ThemedText style={styles.countryName}>{weather.location.country}</ThemedText>

            <View style={styles.tempContainer}>
              <Image
                source={{ uri: `https:${weather.current.condition.icon}` }}
                style={styles.weatherIcon}
                resizeMode="contain"
              />
              {/* Menghapus overlap dengan lineHeight yang pas */}
              <ThemedText style={styles.tempBig}>{Math.round(weather.current.temp_c)}°</ThemedText>
              <ThemedText style={styles.conditionDesc}>{weather.current.condition.text}</ThemedText>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: 'Terasa', value: `${weather.current.feelslike_c}°` },
                { label: 'Lembap', value: `${weather.current.humidity}%` },
                { label: 'Angin', value: `${weather.current.wind_kph} km/j` },
                { label: 'Indeks UV', value: weather.current.uv },
              ].map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.statItem,
                    { backgroundColor: isDark ? '#1e293b' : '#ffffff' }
                  ]}
                >
                  <ThemedText style={styles.statLabel}>{item.label}</ThemedText>
                  <ThemedText style={styles.statValue}>{item.value}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center'
  },
  searchSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
    width: '100%',
    maxWidth: 500,
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  mainDisplay: {
    alignItems: 'center',
    width: '100%',
  },
  cityName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countryName: {
    fontSize: 16,
    opacity: 0.5,
    marginTop: 4,
  },
  tempContainer: {
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
  },
  weatherIcon: {
    width: 120,
    height: 120,
    marginBottom: -10,
  },
  tempBig: {
    fontSize: 86,
    fontWeight: '300',
    lineHeight: 90, // Mencegah tabrakan dengan teks bawah
    textAlign: 'center',
  },
  conditionDesc: {
    fontSize: 22,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 10,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
    marginTop: 20,
  },
  statItem: {
    width: '47%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 24,
    alignItems: 'center',
    // Shadow ringan untuk mode light
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
  },
  errorText: { color: '#ef4444', textAlign: 'center', fontWeight: '600' },
});