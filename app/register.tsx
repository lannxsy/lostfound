import { Link, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth } from '@/lib/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.replace('/(tabs)');
    });
    return unsubscribe;
  }, [router]);

  const onCreateAccount = async () => {
    if (!normalizedEmail || !password) {
      Alert.alert('Validasi', 'Email dan password wajib diisi.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      const code = typeof e?.code === 'string' ? e.code : '';
      if (code === 'auth/email-already-in-use') {
        Alert.alert('Register gagal', 'Email sudah terdaftar. Silakan login.');
        return;
      }
      if (code === 'auth/weak-password') {
        Alert.alert('Register gagal', 'Password terlalu lemah (minimal 6 karakter).');
        return;
      }
      if (code === 'auth/invalid-email') {
        Alert.alert('Register gagal', 'Format email tidak valid.');
        return;
      }
      Alert.alert('Register gagal', e?.message ?? 'Terjadi kesalahan.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Register</ThemedText>

      <ThemedView style={styles.form}>
        <ThemedText>Email</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="email@contoh.com"
          style={styles.input}
        />

        <ThemedText>Password</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="password"
          style={styles.input}
        />

        <Pressable style={styles.primaryButton} onPress={onCreateAccount}>
          <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
            Create Account
          </ThemedText>
        </Pressable>

        <Link href="/login">
          <ThemedText type="link">Sudah punya akun? Login</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 16,
  },
  form: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
});
