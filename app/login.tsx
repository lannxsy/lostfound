import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, View,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { auth } from './lib/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="search" size={36} color="#3b82f6" />
            </View>
            <ThemedText style={styles.appName}>Lost & Found</ThemedText>
            <ThemedText style={styles.tagline}>Temukan kembali barangmu</ThemedText>
          </View>

          {/* FORM */}
          <View style={styles.card}>
            <ThemedText style={styles.cardTitle}>Masuk</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#4b5563" style={styles.inputIcon} />
                <TextInput
                  value={email} onChangeText={setEmail}
                  placeholder="email@kamu.com" placeholderTextColor="#4b5563"
                  style={styles.input} autoCapitalize="none" keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#4b5563" style={styles.inputIcon} />
                <TextInput
                  value={password} onChangeText={setPassword}
                  secureTextEntry={!showPass} placeholder="••••••••"
                  placeholderTextColor="#4b5563" style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#4b5563" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
              onPress={onLogin} disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#0a0a0a" />
                : <ThemedText style={styles.primaryBtnText}>Masuk</ThemedText>}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <ThemedText style={styles.dividerText}>atau</ThemedText>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/register" asChild>
              <Pressable style={styles.secondaryBtn}>
                <ThemedText style={styles.secondaryBtnText}>Buat Akun Baru</ThemedText>
              </Pressable>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },

  hero: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#0f1c2e', borderWidth: 2, borderColor: '#1e3a5f',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#4b5563', marginTop: 6, fontWeight: '500' },

  card: {
    backgroundColor: '#111', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#1f2937',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#3b82f6', fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: '#ffffff', fontSize: 15 },
  eyeBtn: { padding: 4 },

  primaryBtn: {
    backgroundColor: '#3b82f6', borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1f2937' },
  dividerText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },

  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 14,
    height: 54, justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { color: '#3b82f6', fontSize: 15, fontWeight: '700' },
});