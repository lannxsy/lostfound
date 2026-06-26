import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, View,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { auth } from './lib/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
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

  const onRegister = async () => {
    if (!name.trim() || !normalizedEmail || !password) {
      Alert.alert('Lengkapi Data', 'Nama, email, dan password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password Terlalu Pendek', 'Minimal 6 karakter.');
      return;
    }
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Email Sudah Terdaftar', 'Gunakan email lain atau langsung login.');
      } else {
        Alert.alert('Registrasi Gagal', 'Coba lagi nanti.');
      }
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
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={['#818cf8', '#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="person-add" size={32} color="#fff" />
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
              <ThemedText style={styles.cardTitle}>Buat Akun Baru ✨</ThemedText>
              <ThemedText style={styles.cardSubtitle}>Isi data di bawah untuk mulai bergabung</ThemedText>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Nama */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nama Lengkap</ThemedText>
              <View style={[styles.inputWrap, focusedField === 'name' && styles.inputWrapFocused]}>
                <View style={styles.inputIconWrap}>
                  <Ionicons name="person-outline" size={17} color={focusedField === 'name' ? '#818cf8' : '#4b5563'} />
                </View>
                <TextInput
                  value={name} onChangeText={setName}
                  placeholder="Nama kamu"
                  placeholderTextColor="#374151"
                  style={styles.input}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

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
                  placeholder="Min. 6 karakter"
                  placeholderTextColor="#374151"
                  style={[styles.input, { flex: 1 }]}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color="#4b5563" />
                </Pressable>
              </View>
              {/* Password strength hint */}
              {password.length > 0 && (
                <View style={styles.passwordHint}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            password.length >= i * 3
                              ? password.length < 6 ? '#ef4444'
                                : password.length < 10 ? '#f59e0b'
                                : '#34d399'
                              : '#1a1f2e'
                        }
                      ]}
                    />
                  ))}
                  <ThemedText style={styles.strengthText}>
                    {password.length < 6 ? 'Terlalu pendek' : password.length < 10 ? 'Cukup' : 'Kuat'}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Register Button */}
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, marginTop: 6 }]}
              onPress={onRegister}
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
                    <ThemedText style={styles.primaryBtnText}>Daftar Sekarang</ThemedText>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <ThemedText style={styles.orText}>sudah punya akun?</ThemedText>
              <View style={styles.orLine} />
            </View>

            {/* Login link */}
            <Link href="/login" asChild>
              <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}>
                <ThemedText style={styles.secondaryBtnText}>Masuk</ThemedText>
              </Pressable>
            </Link>

            <ThemedText style={styles.footerNote}>
              Dengan mendaftar, kamu setuju dengan ketentuan penggunaan aplikasi
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

  /* Password strength */
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthText: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginLeft: 4, minWidth: 70 },

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