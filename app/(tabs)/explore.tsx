import * as Clipboard from 'expo-clipboard';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  Platform
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  clearExpoPushToken,
  loadExpoPushToken,
  saveExpoPushToken,
} from '@/lib/expo-push-token-store';
import { auth, db } from '../../lib/firebase';
import { registerForPushNotifications, type PushTokenResult } from '@/lib/notifications';

export default function ExplorerScreen() {
  const theme = useColorScheme();
  const isDark = theme === 'dark';

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
    // Karena di web nggak support notif, kita kasih warning biar gak bingung
    if (Platform.OS === 'web') {
      alert('Push Notifications tidak didukung di environment Web (oawkoawk).');
      return;
    }

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
        Alert.alert('Berhasil', 'Expo push token berhasil disimpan.');
      } else {
        Alert.alert('Gagal', next.error ?? 'Token tidak tersedia.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onCopy = async () => {
    if (!tokenToCopy) {
      Alert.alert('Kosong', 'Token belum ada.');
      return;
    }
    await Clipboard.setStringAsync(tokenToCopy);
    if (Platform.OS === 'web') alert('Token disalin!');
    else Alert.alert('Berhasil', 'Token disalin.');
  };

  const onClear = async () => {
    const performClear = async () => {
      await clearExpoPushToken();
      setSavedToken(null);
      setResult(null);
      Alert.alert('Berhasil', 'Token dihapus.');
    };

    if (Platform.OS === 'web') {
      if (confirm('Hapus token yang tersimpan?')) performClear();
    } else {
      Alert.alert('Hapus', 'Hapus token dari penyimpanan lokal?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: performClear }
      ]);
    }
  };

  // Styling dinamis berdasarkan mode
  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? '#1e293b' : '#eff6ff',
      borderColor: isDark ? '#334155' : '#bfdbfe'
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={{ marginTop: 40 }}>Explorer</ThemedText>

        <View style={cardStyle}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">Push Token Debugger</ThemedText>
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.btn, { opacity: isLoading ? 0.6 : 1 }]}
                onPress={onRefreshToken}
                disabled={isLoading}
              >
                <ThemedText type="defaultSemiBold" style={styles.btnText}>
                  {isLoading ? '...' : 'Ambil Token'}
                </ThemedText>
              </Pressable>

              <Pressable style={styles.btn} onPress={onCopy} disabled={!tokenToCopy}>
                <ThemedText type="defaultSemiBold" style={styles.btnText}>Copy</ThemedText>
              </Pressable>

              <Pressable style={styles.btnDanger} onPress={onClear} disabled={!savedToken}>
                <ThemedText type="defaultSemiBold" style={styles.btnText}>Clear</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={[styles.tokenContainer, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
            <ThemedText style={[styles.tokenText, { color: isDark ? '#93c5fd' : '#1e3a8a' }]}>
              {tokenToCopy ?? 'Belum ada token.'}
            </ThemedText>
          </View>

          {!!result?.error && (
            <ThemedText style={{ color: '#ef4444', fontSize: 12 }}>Error: {result.error}</ThemedText>
          )}

          {!!result && (
            <ThemedText style={styles.debugText}>
              Debug: {result.debug.appOwnership} | {result.debug.permissionStatus}
            </ThemedText>
          )}
        </View>

        <ThemedText style={styles.helpText}>
          Tips: Gunakan token ini di dashboard Expo untuk mengetes notifikasi ke device ini.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnText: { color: '#ffffff', fontSize: 13 },
  tokenContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tokenText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  debugText: { fontSize: 11, color: '#64748b', marginTop: 4 },
  helpText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 10 },
});