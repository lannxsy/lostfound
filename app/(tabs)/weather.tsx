import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
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
const BASE_URL = 'http://api.weatherapi.com/v1/current.json';

export default function WeatherScreen() {
  const [query, setQuery] = useState('London');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);

  const locationLabel = useMemo(() => {
    if (!weather) return '-';
    return `${weather.location.name}, ${weather.location.country}`;
  }, [weather]);

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
        const message =
          (json as { error?: { message?: string } })?.error?.message ??
          'Gagal mengambil data cuaca.';
        throw new Error(message);
      }

      setWeather(json as WeatherApiResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Weather</ThemedText>
        <ThemedText style={styles.subtitle}>
          Cari cuaca realtime berdasarkan nama kota.
        </ThemedText>

        <View style={styles.searchCard}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Contoh: London, Jakarta, Bandung"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={fetchWeather}
          />
          <Pressable style={styles.button} onPress={fetchWeather} disabled={isLoading}>
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Get Weather'}
            </ThemedText>
          </Pressable>
        </View>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#2563eb" />
            <ThemedText style={styles.loadingText}>Mengambil data cuaca...</ThemedText>
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorCard}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Request Error
            </ThemedText>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        )}

        {weather && (
          <View style={styles.weatherCard}>
            <ThemedText type="subtitle">{locationLabel}</ThemedText>
            <ThemedText style={styles.metaText}>
              {weather.location.region} • Local time: {weather.location.localtime}
            </ThemedText>

            <View style={styles.tempRow}>
              <ThemedText style={styles.tempMain}>{weather.current.temp_c.toFixed(1)}°C</ThemedText>
              <ThemedText style={styles.conditionText}>{weather.current.condition.text}</ThemedText>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <ThemedText style={styles.gridLabel}>Feels Like</ThemedText>
                <ThemedText type="defaultSemiBold">{weather.current.feelslike_c.toFixed(1)}°C</ThemedText>
              </View>
              <View style={styles.gridItem}>
                <ThemedText style={styles.gridLabel}>Humidity</ThemedText>
                <ThemedText type="defaultSemiBold">{weather.current.humidity}%</ThemedText>
              </View>
              <View style={styles.gridItem}>
                <ThemedText style={styles.gridLabel}>Wind</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {weather.current.wind_kph} kph {weather.current.wind_dir}
                </ThemedText>
              </View>
              <View style={styles.gridItem}>
                <ThemedText style={styles.gridLabel}>UV Index</ThemedText>
                <ThemedText type="defaultSemiBold">{weather.current.uv}</ThemedText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  searchCard: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    padding: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: {
    color: '#334155',
    fontSize: 13,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  errorTitle: {
    color: '#b91c1c',
  },
  errorText: {
    color: '#7f1d1d',
    fontSize: 13,
  },
  weatherCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  tempRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
  },
  tempMain: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    color: '#0c4a6e',
  },
  conditionText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 4,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748b',
  },
});
