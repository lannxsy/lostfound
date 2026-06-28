import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Auto-fill nama dari akun yang sedang login
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) {
      setContactName(user.displayName);
    }
  }, []);

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

  const convertToBase64 = async (uri: string): Promise<string> => {
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
    if (!userId) { Alert.alert('Error', 'Kamu harus login terlebih dahulu.'); return; }

    setIsSubmitting(true);
    try {
      let imageBase64 = '';
      if (imageUri) imageBase64 = await convertToBase64(imageUri);

      await addDoc(collection(db, 'lostfound'), {
        type, title: title.trim(), description: description.trim(),
        category, location, imageUrl: imageBase64,
        contactName: contactName.trim(), contactInfo: contactInfo.trim(),
        status: 'open', createdAt: Date.now(), userId,
      });

      Alert.alert('Berhasil! 🎉', 'Laporan kamu sudah dipublikasikan.', [
        {
          text: 'OK', onPress: () => {
            setTitle(''); setDescription(''); setCategory('');
            setLocation(''); setContactInfo('');
            setImageUri(null); setType('lost');
            // Reset nama ke displayName lagi setelah submit
            const user = auth.currentUser;
            setContactName(user?.displayName ?? '');
          }
        }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Gagal mengirim laporan. Foto terlalu besar, coba tanpa foto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Buat Laporan</ThemedText>
          <ThemedText style={styles.subtitle}>Ceritakan barang hilang atau yang kamu temukan</ThemedText>
        </View>

        {/* TYPE TOGGLE */}
        <View style={styles.typeToggle}>
          <Pressable
            style={[styles.typeBtn, type === 'lost' && styles.typeBtnActive]}
            onPress={() => setType('lost')}
          >
            {type === 'lost' ? (
              <LinearGradient colors={['#7f1d1d', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.typeBtnGradient}>
                <Ionicons name="alert-circle" size={20} color="#fca5a5" />
                <ThemedText style={styles.typeBtnTextActive}>Saya Kehilangan</ThemedText>
              </LinearGradient>
            ) : (
              <>
                <Ionicons name="alert-circle-outline" size={20} color="#4b5563" />
                <ThemedText style={styles.typeBtnText}>Saya Kehilangan</ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.typeBtn, type === 'found' && styles.typeBtnActive]}
            onPress={() => setType('found')}
          >
            {type === 'found' ? (
              <LinearGradient colors={['#052e16', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.typeBtnGradient}>
                <Ionicons name="checkmark-circle" size={20} color="#86efac" />
                <ThemedText style={styles.typeBtnTextActive}>Saya Menemukan</ThemedText>
              </LinearGradient>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#4b5563" />
                <ThemedText style={styles.typeBtnText}>Saya Menemukan</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {/* SECTION: FOTO */}
        <ThemedText style={styles.sectionLabel}>📷 Foto Barang <ThemedText style={styles.optional}>(opsional)</ThemedText></ThemedText>
        <Pressable style={styles.imagePickerBtn} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <LinearGradient colors={['#1e1b4b', '#141822']} style={styles.imageIconWrap}>
                <Ionicons name="camera-outline" size={32} color="#6366f1" />
              </LinearGradient>
              <ThemedText style={styles.imagePlaceholderText}>Tap untuk tambah foto</ThemedText>
              <ThemedText style={styles.imagePlaceholderSub}>Foto dikompres otomatis</ThemedText>
            </View>
          )}
        </Pressable>
        {imageUri && (
          <Pressable style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <ThemedText style={styles.removeImageText}>Hapus Foto</ThemedText>
          </Pressable>
        )}

        {/* JUDUL */}
        <ThemedText style={styles.sectionLabel}>Nama Barang <ThemedText style={styles.required}>*</ThemedText></ThemedText>
        <TextInput
          style={inputStyle('title')}
          placeholder="Contoh: Dompet hitam, KTM atas nama..."
          placeholderTextColor="#374151"
          value={title}
          onChangeText={setTitle}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField(null)}
        />

        {/* DESKRIPSI */}
        <ThemedText style={styles.sectionLabel}>Deskripsi <ThemedText style={styles.optional}>(opsional)</ThemedText></ThemedText>
        <TextInput
          style={[inputStyle('desc'), styles.textArea]}
          placeholder="Ciri-ciri, warna, merek, kondisi, dll..."
          placeholderTextColor="#374151"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          onFocus={() => setFocusedField('desc')}
          onBlur={() => setFocusedField(null)}
        />

        {/* KATEGORI */}
        <ThemedText style={styles.sectionLabel}>Kategori <ThemedText style={styles.required}>*</ThemedText></ThemedText>
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
        <ThemedText style={styles.sectionLabel}>Lokasi <ThemedText style={styles.required}>*</ThemedText></ThemedText>
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
        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <Ionicons name="person-circle-outline" size={18} color="#6366f1" />
            <ThemedText style={styles.contactHeaderText}>Info Kontak</ThemedText>
          </View>

          <ThemedText style={styles.sectionLabel}>Nama Kamu <ThemedText style={styles.required}>*</ThemedText></ThemedText>
          <TextInput
            style={inputStyle('name')}
            placeholder="Nama lengkap atau panggilan"
            placeholderTextColor="#374151"
            value={contactName}
            onChangeText={setContactName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />

          <ThemedText style={styles.sectionLabel}>No. WA / Line / Instagram <ThemedText style={styles.required}>*</ThemedText></ThemedText>
          <TextInput
            style={inputStyle('contact')}
            placeholder="Kontak yang bisa dihubungi"
            placeholderTextColor="#374151"
            value={contactInfo}
            onChangeText={setContactInfo}
            onFocus={() => setFocusedField('contact')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* SUBMIT */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed || isSubmitting ? 0.85 : 1 }]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={['#6366f1', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <ThemedText style={styles.submitBtnText}>Publikasikan Laporan</ThemedText>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080b14' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  header: { paddingTop: 60, marginBottom: 22 },
  title: { fontSize: 30, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.8 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: '500', lineHeight: 20 },

  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 18,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#1e2130',
    overflow: 'hidden', minHeight: 52,
  },
  typeBtnActive: { borderWidth: 0 },
  typeBtnGradient: { width: '100%', height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#4b5563', paddingVertical: 14 },
  typeBtnTextActive: { fontSize: 13, fontWeight: '700', color: '#fff' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#818cf8', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  required: { color: '#f87171' },
  optional: { color: '#4b5563', textTransform: 'none', fontSize: 11, fontWeight: '500' },

  imagePickerBtn: {
    borderRadius: 18, overflow: 'hidden', marginBottom: 8,
    borderWidth: 2, borderColor: '#1e2130', borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: 200 },
  imagePlaceholder: { height: 150, justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#0f1117' },
  imageIconWrap: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  imagePlaceholderSub: { fontSize: 11, color: '#374151', fontWeight: '500' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 16 },
  removeImageText: { fontSize: 12, color: '#ef4444', fontWeight: '700' },

  input: {
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#1e2130',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15,
    color: '#f1f5f9', fontSize: 14, fontWeight: '500', marginBottom: 18,
  },
  inputFocused: { borderColor: '#6366f1', backgroundColor: '#0d0f1a' },
  textArea: { minHeight: 90, paddingTop: 14 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#1e2130',
  },
  chipActive: { backgroundColor: '#1e1b4b', borderColor: '#6366f1' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  chipTextActive: { color: '#818cf8' },

  contactSection: {
    backgroundColor: '#0f1117', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#1e2130', marginBottom: 22,
  },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  contactHeaderText: { fontSize: 14, fontWeight: '800', color: '#f1f5f9' },

  submitBtn: {
    borderRadius: 18, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});