import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { addDoc, collection } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '../lib/firebase';

const CATEGORIES = ['Elektronik', 'Dokumen/KTM', 'Kunci', 'Pakaian', 'Tas', 'Lainnya'];
const LOCATIONS = ['Lab Komputer', 'Kelas', 'Kantin', 'Masjid', 'Parkiran', 'Perpustakaan', 'Lobby'];

export default function LaporScreen() {
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk foto barang.');
      return;
    }
    Alert.alert('Tambah Foto', 'Pilih sumber foto', [
      {
        text: 'Kamera', onPress: async () => {
          const camPerm = await ImagePicker.requestCameraPermissionsAsync();
          if (camPerm.status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({ quality: 0.3, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        }
      },
      {
        text: 'Galeri', onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.3, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        }
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  // Kompres foto jadi kecil lalu ubah ke base64
  const convertToBase64 = async (uri: string): Promise<string> => {
    // Kompres dan resize ke 400x400 max, quality 30%
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return `data:image/jpeg;base64,${compressed.base64}`;
  };

  const onSubmit = async () => {
    if (!title.trim()) { Alert.alert('Lengkapi Form', 'Judul barang wajib diisi.'); return; }
    if (!category) { Alert.alert('Lengkapi Form', 'Pilih kategori barang.'); return; }
    if (!location) { Alert.alert('Lengkapi Form', 'Pilih lokasi.'); return; }
    if (!contactName.trim() || !contactInfo.trim()) { Alert.alert('Lengkapi Form', 'Info kontak wajib diisi.'); return; }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'Kamu harus login terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageBase64 = '';
      if (imageUri) {
        imageBase64 = await convertToBase64(imageUri);
      }

      await addDoc(collection(db, 'lostfound'), {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        location,
        imageUrl: imageBase64, // simpan base64 ke Firestore
        contactName: contactName.trim(),
        contactInfo: contactInfo.trim(),
        status: 'open',
        createdAt: Date.now(),
        userId,
      });

      Alert.alert('Berhasil! 🎉', 'Laporan kamu sudah dipublikasikan.', [
        {
          text: 'OK', onPress: () => {
            setTitle(''); setDescription(''); setCategory('');
            setLocation(''); setContactName(''); setContactInfo('');
            setImageUri(null); setType('lost');
          }
        }
      ]);
    } catch (e) {
      console.error('Submit error:', e);
      Alert.alert('Error', 'Gagal mengirim laporan. Foto terlalu besar, coba tanpa foto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Buat Laporan</ThemedText>
          <ThemedText style={styles.subtitle}>Barang hilang atau kamu temukan sesuatu?</ThemedText>
        </View>

        {/* TYPE TOGGLE */}
        <View style={styles.typeToggle}>
          <Pressable
            style={[styles.typeBtn, type === 'lost' && styles.typeBtnLost]}
            onPress={() => setType('lost')}
          >
            <Ionicons name="alert-circle-outline" size={18} color={type === 'lost' ? '#fff' : '#4b5563'} />
            <ThemedText style={[styles.typeBtnText, type === 'lost' && styles.typeBtnTextActive]}>
              Saya Kehilangan
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, type === 'found' && styles.typeBtnFound]}
            onPress={() => setType('found')}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={type === 'found' ? '#fff' : '#4b5563'} />
            <ThemedText style={[styles.typeBtnText, type === 'found' && styles.typeBtnTextActive]}>
              Saya Menemukan
            </ThemedText>
          </Pressable>
        </View>

        {/* FOTO */}
        <ThemedText style={styles.label}>Foto Barang <ThemedText style={styles.optional}>(opsional)</ThemedText></ThemedText>
        <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color="#4b5563" />
              <ThemedText style={styles.imagePlaceholderText}>Tap untuk foto barang</ThemedText>
              <ThemedText style={styles.imagePlaceholderSub}>Foto akan dikompres otomatis</ThemedText>
            </View>
          )}
        </Pressable>
        {imageUri && (
          <Pressable style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
            <ThemedText style={styles.removeImageText}>Hapus Foto</ThemedText>
          </Pressable>
        )}

        {/* JUDUL */}
        <ThemedText style={styles.label}>Nama/Judul Barang <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Dompet hitam, KTM atas nama..."
          placeholderTextColor="#4b5563"
          value={title}
          onChangeText={setTitle}
        />

        {/* DESKRIPSI */}
        <ThemedText style={styles.label}>Deskripsi</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ciri-ciri barang, warna, merek, kondisi, dll..."
          placeholderTextColor="#4b5563"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* KATEGORI */}
        <ThemedText style={styles.label}>Kategori <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <View style={styles.chipGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <ThemedText style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</ThemedText>
            </Pressable>
          ))}
        </View>

        {/* LOKASI */}
        <ThemedText style={styles.label}>Lokasi <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <View style={styles.chipGrid}>
          {LOCATIONS.map((loc) => (
            <Pressable
              key={loc}
              style={[styles.chip, location === loc && styles.chipActive]}
              onPress={() => setLocation(loc)}
            >
              <ThemedText style={[styles.chipText, location === loc && styles.chipTextActive]}>{loc}</ThemedText>
            </Pressable>
          ))}
        </View>

        {/* KONTAK */}
        <ThemedText style={styles.label}>Nama Kamu <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Nama lengkap atau nama panggilan"
          placeholderTextColor="#4b5563"
          value={contactName}
          onChangeText={setContactName}
        />

        <ThemedText style={styles.label}>No. WA / Line / Instagram <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Kontak yang bisa dihubungi"
          placeholderTextColor="#4b5563"
          value={contactInfo}
          onChangeText={setContactInfo}
        />

        {/* SUBMIT */}
        <Pressable
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <ThemedText style={styles.submitBtnText}>Publikasikan Laporan</ThemedText>
            </>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 60, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#4b5563', marginTop: 2, fontWeight: '600' },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1f2937',
  },
  typeBtnLost: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
  typeBtnFound: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#4b5563' },
  typeBtnTextActive: { color: '#ffffff' },
  label: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  required: { color: '#ef4444' },
  optional: { color: '#4b5563', textTransform: 'none', fontSize: 11 },
  imagePickerBtn: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 8,
    borderWidth: 2, borderColor: '#1f2937', borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: 200 },
  imagePlaceholder: { height: 160, justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#111' },
  imagePlaceholderText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
  imagePlaceholderSub: { fontSize: 11, color: '#374151', fontWeight: '500' },
  removeImageBtn: { alignItems: 'center', marginBottom: 16 },
  removeImageText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  input: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 16,
  },
  textArea: { minHeight: 90, paddingTop: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1f2937',
  },
  chipActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  chipTextActive: { color: '#3b82f6' },
  submitBtn: {
    backgroundColor: '#3b82f6', borderRadius: 18, paddingVertical: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
});