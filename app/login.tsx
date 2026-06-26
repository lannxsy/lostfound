import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, View,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { auth } from './lib/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.replace('/(tabs)');
    });
    return unsubscribe;
  }, [router]);

  const onLogin = async () => {
    if (!normalizedEmail || !password) {
      Alert.alert('Lengkapi Data', 'Email dan password wajib diisi.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login Gagal', 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* HERO SECTION */}
          <View style={styles.hero}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={['#818cf8', '#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="search" size={34} color="#fff" />
              </LinearGradient>
              <View style={styles.logoPulse1} />
              <View style={styles.logoPulse2} />
            </View>

            <ThemedText style={styles.appName}>Lost & Found</ThemedText>

            <View style={styles.institutionBadge}>
              <View style={styles.institutionDot} />
              <ThemedText style={styles.institutionText}>STMIK AMIK Bandung</ThemedText>
            </View>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* Card Header - centered */}
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Selamat Datang 👋</ThemedText>
              <ThemedText style={styles.cardSubtitle}>Masuk ke akunmu untuk melanjutkan</ThemedText>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={[styles.inputWrap, focusedField === 'email' && styles.inputWrapFocused]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? '#818cf8' : '#4b5563'} />
                </View>
                <TextInput
                  value={email} onChangeText={setEmail}
                  placeholder="email@kamu.com"
                  placeholderTextColor="#374151"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'pass' ? '#818cf8' : '#4b5563'} />
                </View>
                <TextInput
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  placeholder="••••••••"
                  placeholderTextColor="#374151"
                  style={[styles.input, { flex: 1 }]}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="#4b5563" />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, marginTop: 6 }]}
              onPress={onLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#818cf8', '#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <ThemedText style={styles.primaryBtnText}>Masuk</ThemedText>
                    <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <ThemedText style={styles.orText}>atau</ThemedText>
              <View style={styles.orLine} />
            </View>

            {/* Register link */}
            <Link href="/register" asChild>
              <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}>
                <ThemedText style={styles.secondaryBtnText}>Buat Akun Baru</ThemedText>
              </Pressable>
            </Link>

            <ThemedText style={styles.footerNote}>
              Dengan masuk, kamu setuju dengan ketentuan penggunaan aplikasi
            </ThemedText>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080f' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 56,
  },

  /* ── HERO ── */
  hero: { alignItems: 'center', marginBottom: 36 },
  logoWrap: { position: 'relative', marginBottom: 22, alignItems: 'center', justifyContent: 'center' },
  logoGradient: {
    width: 80, height: 80, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  logoPulse1: {
    position: 'absolute',
    width: 96, height: 96, borderRadius: 30,
    borderWidth: 1.5, borderColor: '#6366f125',
  },
  logoPulse2: {
    position: 'absolute',
    width: 112, height: 112, borderRadius: 34,
    borderWidth: 1, borderColor: '#6366f110',
  },
  appName: {
    fontSize: 36, fontWeight: '900', color: '#f1f5f9',
    letterSpacing: -1.2, textAlign: 'center', marginBottom: 12,
  },
  institutionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#13112b', borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#4f46e530',
  },
  institutionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#818cf8' },
  institutionText: { fontSize: 11, color: '#818cf8', fontWeight: '700', letterSpacing: 0.6 },

  /* ── CARD ── */
  card: {
    backgroundColor: '#0d1019',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: '#1a1f2e',
  },
  cardHeader: { alignItems: 'center', marginBottom: 22 },
  cardTitle: {
    fontSize: 24, fontWeight: '800', color: '#f1f5f9',
    textAlign: 'center', marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13, color: '#6b7280', fontWeight: '500',
    textAlign: 'center', lineHeight: 20,
  },
  cardDivider: { height: 1, backgroundColor: '#1a1f2e', marginBottom: 22 },

  /* ── INPUTS ── */
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 11, color: '#818cf8', fontWeight: '700',
    marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#080b12', borderWidth: 1.5, borderColor: '#1a1f2e',
    borderRadius: 16, paddingHorizontal: 4, paddingRight: 14,
  },
  inputWrapFocused: { borderColor: '#6366f1' },
  inputIconWrap: {
    width: 42, height: 52, justifyContent: 'center', alignItems: 'center',
  },
  input: { flex: 1, height: 52, color: '#f1f5f9', fontSize: 15 },
  eyeBtn: { padding: 8 },

  /* ── BUTTONS ── */
  primaryBtn: {
    borderRadius: 16, height: 56,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#1a1f2e' },
  orText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#6366f130', borderRadius: 16,
    height: 52, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#13112b',
  },
  secondaryBtnText: { color: '#818cf8', fontSize: 15, fontWeight: '700', textAlign: 'center' },

  footerNote: {
    fontSize: 11, color: '#374151', textAlign: 'center',
    marginTop: 18, lineHeight: 18, fontWeight: '500',
  },
});