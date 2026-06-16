import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../lib/firebase';

export interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl: string;
  contactName: string;
  contactInfo: string;
  status: 'open' | 'resolved';
  createdAt: number;
  userId: string;
}

const CATEGORIES = ['Semua', 'Elektronik', 'Dokumen/KTM', 'Kunci', 'Pakaian', 'Tas', 'Lainnya'];
const LOCATIONS = ['Semua Lokasi', 'Lab Komputer', 'Kelas', 'Kantin', 'Masjid', 'Parkiran', 'Perpustakaan', 'Lobby'];

export default function FeedScreen() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filtered, setFiltered] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [activeType, setActiveType] = useState<'all' | 'lost' | 'found'>('all');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'lostfound'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LostFoundItem, 'id'>) }));
      setItems(data);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let result = items;
    if (activeType !== 'all') result = result.filter((i) => i.type === activeType);
    if (activeCategory !== 'Semua') result = result.filter((i) => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [items, activeType, activeCategory, searchQuery]);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const typeColor = (type: 'lost' | 'found') => type === 'lost' ? '#ef4444' : '#3b82f6';
  const typeLabel = (type: 'lost' | 'found') => type === 'lost' ? '🔴 Hilang' : '🔵 Ditemukan';

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Lost & Found</ThemedText>
        <ThemedText style={styles.subtitle}>STMIK AMIK Bandung</ThemedText>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#4b5563" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari barang..."
          placeholderTextColor="#4b5563"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* TYPE FILTER */}
      <View style={styles.filterRow}>
        {(['all', 'lost', 'found'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.filterBtn, activeType === t && styles.filterBtnActive]}
            onPress={() => setActiveType(t)}
          >
            <ThemedText style={[styles.filterBtnText, activeType === t && styles.filterBtnTextActive]}>
              {t === 'all' ? 'Semua' : t === 'lost' ? '🔴 Hilang' : '🔵 Ketemu'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* CATEGORY FILTER */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.catChip, activeCategory === item && styles.catChipActive]}
            onPress={() => setActiveCategory(item)}
          >
            <ThemedText style={[styles.catChipText, activeCategory === item && styles.catChipTextActive]}>
              {item}
            </ThemedText>
          </Pressable>
        )}
      />

      {/* STATS */}
      <View style={styles.statsBar}>
        <ThemedText style={styles.statsText}>
          {filtered.length} laporan ditemukan
        </ThemedText>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
          <ThemedText style={styles.emptyTitle}>Belum Ada Laporan</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Belum ada laporan barang hilang/ditemukan.{'\n'}Tap tab <ThemedText style={styles.emptyBold}>Lapor</ThemedText> untuk membuat laporan!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelectedItem(item)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
                  <Ionicons name="image-outline" size={28} color="#4b5563" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <View style={styles.cardTypeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor(item.type) + '20', borderColor: typeColor(item.type) + '60' }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: typeColor(item.type) }]}>
                      {typeLabel(item.type)}
                    </ThemedText>
                  </View>
                  {item.status === 'resolved' && (
                    <View style={styles.resolvedBadge}>
                      <ThemedText style={styles.resolvedText}>✅ Selesai</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={12} color="#4b5563" />
                  <ThemedText style={styles.cardMetaText}>{item.location}</ThemedText>
                  <ThemedText style={styles.cardMetaDot}>·</ThemedText>
                  <ThemedText style={styles.cardMetaText}>{formatDate(item.createdAt)}</ThemedText>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem.imageUrl ? (
                  <Image source={{ uri: selectedItem.imageUrl }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                    <Ionicons name="image-outline" size={48} color="#4b5563" />
                  </View>
                )}
                <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>

                <View style={styles.modalContent}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor(selectedItem.type) + '20', borderColor: typeColor(selectedItem.type) + '60', alignSelf: 'flex-start', marginBottom: 10 }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: typeColor(selectedItem.type) }]}>
                      {typeLabel(selectedItem.type)}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.modalTitle}>{selectedItem.title}</ThemedText>

                  <View style={styles.tagRow}>
                    <View style={styles.tag}>
                      <ThemedText style={styles.tagText}>📦 {selectedItem.category}</ThemedText>
                    </View>
                    <View style={styles.tag}>
                      <ThemedText style={styles.tagText}>📍 {selectedItem.location}</ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.sectionTitle}>Deskripsi</ThemedText>
                  <ThemedText style={styles.description}>{selectedItem.description}</ThemedText>

                  <ThemedText style={styles.sectionTitle}>Kontak</ThemedText>
                  <View style={styles.contactCard}>
                    <Ionicons name="person-circle-outline" size={36} color="#3b82f6" />
                    <View style={{ marginLeft: 12 }}>
                      <ThemedText style={styles.contactName}>{selectedItem.contactName}</ThemedText>
                      <ThemedText style={styles.contactInfo}>{selectedItem.contactInfo}</ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.postedDate}>
                    Diposting {formatDate(selectedItem.createdAt)}
                  </ThemedText>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingTop: 60, paddingHorizontal: 24, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#3b82f6', marginTop: 2, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 12,
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1f2937',
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, color: '#fff', fontSize: 14, fontWeight: '500' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 12 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1f2937',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  filterBtnTextActive: { color: '#3b82f6' },
  catList: { paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1f2937',
  },
  catChipActive: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#4b5563' },
  catChipTextActive: { color: '#3b82f6' },
  statsBar: { paddingHorizontal: 24, marginBottom: 8 },
  statsText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 22 },
  emptyBold: { fontWeight: '800', color: '#3b82f6' },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 18,
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1f2937',
  },
  cardThumb: { width: 80, height: 80 },
  cardThumbPlaceholder: { backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12 },
  cardTypeRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  resolvedBadge: { backgroundColor: '#1a2a1a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  resolvedText: { fontSize: 10, fontWeight: '700', color: '#4ade80' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginBottom: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
  cardMetaDot: { fontSize: 11, color: '#4b5563' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  modalImage: { width: '100%', height: 220, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalImagePlaceholder: { backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: 8,
  },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginBottom: 12 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#1a2233', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#1e3a5f' },
  tagText: { fontSize: 12, color: '#3b82f6', fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  description: { fontSize: 14, color: '#d1d5db', lineHeight: 24, marginBottom: 20 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a2233', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 20,
  },
  contactName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  contactInfo: { fontSize: 13, color: '#3b82f6', fontWeight: '600', marginTop: 2 },
  postedDate: { fontSize: 12, color: '#4b5563', fontWeight: '600', marginBottom: 40, textAlign: 'center' },
});