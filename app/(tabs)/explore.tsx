import * as Clipboard from 'expo-clipboard';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  clearExpoPushToken,
  loadExpoPushToken,
  saveExpoPushToken,
} from '@/lib/expo-push-token-store';
import { auth, db } from '@/lib/firebase';
import { registerForPushNotifications, type PushTokenResult } from '@/lib/notifications';

export default function ExplorerScreen() {
  const [result, setResult] = useState<PushTokenResult | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadExpoPushToken().then((saved) => {
      if (saved?.token) setSavedToken(saved.token);
    });
  }, []);

  const tokenToCopy = result?.token ?? savedToken;

  const onRefreshToken = async () => {
    setIsLoading(true);
    try {
      const next = await registerForPushNotifications();
      setResult(next);

      if (next.token) {
        setSavedToken(next.token);
        await saveExpoPushToken(next);

        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'users', user.uid), { expoPushToken: next.token }, { merge: true });
        }

        Alert.alert('Berhasil', 'Expo push token berhasil diambil dan disimpan.');
      } else {
        Alert.alert('Gagal', next.error ?? 'Token tidak tersedia.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onCopy = async () => {
    if (!tokenToCopy) {
      Alert.alert('Expo Push Token', 'Token belum ada. Tekan "Ambil Token".');
      return;
    }
    await Clipboard.setStringAsync(tokenToCopy);
    Alert.alert('Berhasil', 'Token disalin.');
  };

  const onClear = async () => {
    await clearExpoPushToken();
    setSavedToken(null);
    Alert.alert('Berhasil', 'Token tersimpan dihapus.');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Explorer</ThemedText>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">Expo Push Token</ThemedText>
            <View style={styles.actionsRow}>
              <Pressable style={styles.btn} onPress={onRefreshToken} disabled={isLoading}>
                <ThemedText type="defaultSemiBold" style={styles.btnText}>
                  {isLoading ? 'Loading...' : 'Ambil Token'}
                </ThemedText>
              </Pressable>
              <Pressable style={styles.btn} onPress={onCopy} disabled={!tokenToCopy}>
                <ThemedText type="defaultSemiBold" style={styles.btnText}>
                  Copy
                </ThemedText>
              </Pressable>
              <Pressable style={styles.btnDanger} onPress={onClear} disabled={!savedToken}>
                <ThemedText type="defaultSemiBold" style={styles.btnText}>
                  Clear
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <ThemedText style={styles.tokenText}>{tokenToCopy ?? '-'}</ThemedText>

          {!!result?.error && <ThemedText style={styles.debugText}>Error: {result.error}</ThemedText>}
          {!!result && (
            <ThemedText style={styles.debugText}>
              Debug: ownership={result.debug.appOwnership ?? '-'}, projectIdFromConfig=
              {result.debug.projectIdFromConfig ?? '-'}, projectIdToUse={result.debug.projectIdToUse ?? '-'},
              permission={result.debug.permissionStatus ?? '-'}
            </ThemedText>
          )}

          {!result?.token && !!savedToken && (
            <ThemedText style={styles.debugText}>
              Token di atas berasal dari penyimpanan lokal (AsyncStorage).
            </ThemedText>
          )}
        </View>

        <ThemedText style={styles.helpText}>
          Untuk test kirim notif, buka: https://expo.dev/notifications lalu paste Expo Push Token.
        </ThemedText>
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
  card: {
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 10,
  },
  cardHeader: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  btn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  tokenText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#1e3a8a',
  },
  debugText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#334155',
  },
  helpText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
});
