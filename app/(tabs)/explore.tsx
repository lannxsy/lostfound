import * as Clipboard from 'expo-clipboard';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  clearExpoPushToken,
  loadExpoPushToken,
  saveExpoPushToken,
} from '../lib/expo-push-token-store';
import { auth, db } from '../lib/firebase';
import { registerForPushNotifications, type PushTokenResult } from '../lib/notifications';

interface Todo {
  id: string;
  done: boolean;
}

export default function ExplorerScreen() {
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const [result, setResult] = useState<PushTokenResult | null>(null);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'todos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadExpoPushToken().then((saved) => {
      if (saved?.token) setSavedToken(saved.token);
    });
  }, []);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.done).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  const tokenToCopy = result?.token ?? savedToken;

  const onRefreshToken = async () => {
    if (Platform.OS === 'web') {
      alert('Access Denied: Environment not supported.');
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
        Alert.alert('Status: Active', 'Network token updated successfully.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onCopy = async () => {
    if (!tokenToCopy) return;
    await Clipboard.setStringAsync(tokenToCopy);
    if (Platform.OS === 'web') alert('Data Encrypted & Copied!');
    else Alert.alert('Success', 'Access token copied to secure clipboard.');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="umbrella" size={32} color="#ef4444" />
          <ThemedText type="title" style={styles.mainTitle}>Operation Brief</ThemedText>
        </View>

        {/* SECTION 1: MISSION STATISTICS */}
        <ThemedText style={styles.sectionLabel}>Mission Intelligence</ThemedText>
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="shield-checkmark" size={22} color="#b91c1c" />
            <ThemedText style={styles.statsNumber}>{stats.completed}</ThemedText>
            <ThemedText style={styles.statsLabel}>Cleared</ThemedText>
          </View>
          <View style={[styles.statsCard, { backgroundColor: '#f1f5f9' }]}>
            <Ionicons name="flash" size={22} color="#475569" />
            <ThemedText style={styles.statsNumber}>{stats.pending}</ThemedText>
            <ThemedText style={styles.statsLabel}>Active</ThemedText>
          </View>
          <View style={[styles.statsCard, { backgroundColor: isDark ? '#334155' : '#1e293b' }]}>
            <Ionicons name="grid" size={22} color="#fff" />
            <ThemedText style={[styles.statsNumber, { color: '#fff' }]}>{stats.total}</ThemedText>
            <ThemedText style={[styles.statsLabel, { color: '#cbd5e1' }]}>Total</ThemedText>
          </View>
        </View>

        {/* SECTION 2: ACCESS & SUPPORT */}
        <ThemedText style={styles.sectionLabel}>HQ Access</ThemedText>
        <View style={[styles.menuContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Intel', 'Umbrella Task v1.0.4 - Secure Build')}>
            <Ionicons name="finger-print" size={20} color={isDark ? '#ef4444' : '#b91c1c'} />
            <ThemedText style={styles.menuText}>System Protocol</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.menuItem} onPress={() => Alert.alert('Support', 'Contacting Umbrella HQ...')}>
            <Ionicons name="call-outline" size={20} color={isDark ? '#ef4444' : '#b91c1c'} />
            <ThemedText style={styles.menuText}>Contact Command</ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </View>

        {/* SECTION 3: SYSTEM DEBUGGER */}
        <ThemedText style={styles.sectionLabel}>Neural Link Debug</ThemedText>
        <View style={[styles.card, { backgroundColor: isDark ? '#0f172a' : '#fff', borderColor: '#ef4444' }]}>
          <ThemedText type="defaultSemiBold" style={{ color: '#ef4444' }}>Network Token ID</ThemedText>
          <View style={[styles.tokenBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <ThemedText style={styles.tokenText}>{tokenToCopy ?? 'No encrypted link found.'}</ThemedText>
          </View>
          <View style={styles.actionsRow}>
            <Pressable style={styles.btnRed} onPress={onRefreshToken} disabled={isLoading}>
              <ThemedText style={styles.btnText}>{isLoading ? '...' : 'Sync Link'}</ThemedText>
            </Pressable>
            <Pressable style={styles.btnDark} onPress={onCopy} disabled={!tokenToCopy}>
              <ThemedText style={styles.btnText}>Copy ID</ThemedText>
            </Pressable>
          </View>
        </View>

        <ThemedText style={styles.footerText}>
          Personnel: Harlan Aria Pratama {"\n"}
          Division: STMIK AMIK Bandung - Umbrella Corp.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 25, gap: 10, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 10, gap: 12 },
  mainTitle: { flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
  
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statsCard: { flex: 1, paddingVertical: 20, paddingHorizontal: 10, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  statsNumber: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginTop: 8 },
  statsLabel: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },

  // Menu
  menuContainer: { borderRadius: 24, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#475569' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 20 },

  // Token Card
  card: { padding: 20, borderRadius: 28, gap: 15, borderWidth: 1.5 },
  tokenBox: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  tokenText: { fontSize: 10, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  btnRed: { backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 14, flex: 1.5, alignItems: 'center', shadowColor: '#ef4444', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  btnDark: { backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 14, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  footerText: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 40, lineHeight: 18, fontWeight: '500' }
});