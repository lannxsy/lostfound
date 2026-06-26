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
import { LinearGradient } from 'expo-linear-gradient';
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

export default function FeedScreen() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filtered, setFiltered] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [activeType, setActiveType] = useState<'all' | 'lost' | 'found'>('all');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'lostfound'), orderBy('createdAt', 'desc'));
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

  const lostCount = items.filter(i => i.type === 'lost' && i.status === 'open').length;
  const foundCount = items.filter(i => i.type === 'found' && i.status === 'open').length;

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title}>Lost & Found</ThemedText>
          <ThemedText style={styles.subtitle}>STMIK AMIK Bandung</ThemedText>
        </View>
        <View style={styles.headerBadge}>
          <View style={styles.dot} />
          <ThemedText style={styles.headerBadgeText}>Live</ThemedText>
        </View>
      </View>

      {/* STAT PILLS */}
      <View style={styles.statRow}>
        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#f87171' }]} />
          <ThemedText style={styles.statPillText}>{lostCount} Hilang</ThemedText>
        </View>
        <View style={styles.statPill}>
          <View style={[styles.statDot, { backgroundColor: '#34d399' }]} />
          <ThemedText style={styles.statPillText}>{foundCount} Ditemukan</ThemedText>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="list-outline" size={12} color="#818cf8" />
          <ThemedText style={styles.statPillText}>{filtered.length} hasil</ThemedText>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari barang..."
          placeholderTextColor="#4b5563"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {/* TYPE FILTER */}
      <View style={styles.filterRow}>
        {(['all', 'lost', 'found'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.filterBtn, activeType === t && (t === 'lost' ? styles.filterBtnLost : t === 'found' ? styles.filterBtnFound : styles.filterBtnAll)]}
            onPress={() => setActiveType(t)}
          >
            {activeType === t && t !== 'all' ? (
              <LinearGradient
                colors={t === 'lost' ? ['#7f1d1d', '#ef4444'] : ['#1e3a5f', '#3b82f6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.filterBtnGradient}
              >
                <ThemedText style={styles.filterBtnTextActive}>
                  {t === 'lost' ? '🔴 Hilang' : '🟢 Ketemu'}
                </ThemedText>
              </LinearGradient>
            ) : (
              <ThemedText style={[styles.filterBtnText, activeType === t && styles.filterBtnTextActive]}>
                {t === 'all' ? '✦ Semua' : t === 'lost' ? '🔴 Hilang' : '🟢 Ketemu'}
              </ThemedText>
            )}
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

      {/* LIST */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#6366f1" />
          <ThemedText style={styles.loadingText}>Memuat laporan...</ThemedText>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search-outline" size={40} color="#6366f1" />
          </View>
          <ThemedText style={styles.emptyTitle}>Belum Ada Laporan</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Belum ada laporan yang cocok.{'\n'}
            Tap tab <ThemedText style={styles.emptyBold}>Lapor</ThemedText> untuk membuat laporan!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setSelectedItem(item)}
            >
              {/* Left accent bar */}
              <View style={[styles.cardAccent, { backgroundColor: item.type === 'lost' ? '#ef4444' : '#34d399' }]} />

              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color="#374151" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <View style={styles.cardTypeRow}>
                  <View style={[
                    styles.typeBadge,
                    item.type === 'lost' ? styles.typeBadgeLost : styles.typeBadgeFound
                  ]}>
                    <ThemedText style={[
                      styles.typeBadgeText,
                      { color: item.type === 'lost' ? '#fca5a5' : '#6ee7b7' }
                    ]}>
                      {item.type === 'lost' ? '● Hilang' : '● Ditemukan'}
                    </ThemedText>
                  </View>
                  {item.status === 'resolved' && (
                    <View style={styles.resolvedBadge}>
                      <ThemedText style={styles.resolvedText}>Selesai</ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={11} color="#6b7280" />
                  <ThemedText style={styles.cardMetaText}>{item.location}</ThemedText>
                  <ThemedText style={styles.cardMetaDot}>·</ThemedText>
                  <ThemedText style={styles.cardMetaText}>{formatDate(item.createdAt)}</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#374151" style={{ marginRight: 12 }} />
            </Pressable>
          )}
        />
      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedItem(null)} />
          <View style={styles.modalSheet}>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem.imageUrl ? (
                  <Image source={{ uri: selectedItem.imageUrl }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                    <Ionicons name="image-outline" size={48} color="#374151" />
                  </View>
                )}

                {/* Close & type badge overlay */}
                <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                <View style={[
                  styles.modalTypePill,
                  selectedItem.type === 'lost' ? styles.modalTypePillLost : styles.modalTypePillFound
                ]}>
                  <ThemedText style={styles.modalTypePillText}>
                    {selectedItem.type === 'lost' ? '🔴 Hilang' : '🟢 Ditemukan'}
                  </ThemedText>
                </View>

                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>{selectedItem.title}</ThemedText>

                  <View style={styles.tagRow}>
                    <View style={styles.tag}>
                      <Ionicons name="cube-outline" size={12} color="#818cf8" />
                      <ThemedText style={styles.tagText}>{selectedItem.category}</ThemedText>
                    </View>
                    <View style={styles.tag}>
                      <Ionicons name="location-outline" size={12} color="#818cf8" />
                      <ThemedText style={styles.tagText}>{selectedItem.location}</ThemedText>
                    </View>
                  </View>

                  {selectedItem.description ? (
                    <>
                      <ThemedText style={styles.sectionTitle}>Deskripsi</ThemedText>
                      <ThemedText style={styles.description}>{selectedItem.description}</ThemedText>
                    </>
                  ) : null}

                  <ThemedText style={styles.sectionTitle}>Kontak</ThemedText>
                  <View style={styles.contactCard}>
                    <LinearGradient colors={['#6366f1', '#3b82f6']} style={styles.contactAvatar}>
                      <ThemedText style={styles.contactAvatarText}>
                        {selectedItem.contactName.charAt(0).toUpperCase()}
                      </ThemedText>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.contactName}>{selectedItem.contactName}</ThemedText>
                      <ThemedText style={styles.contactInfo}>{selectedItem.contactInfo}</ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.postedDate}>
                    📅 Diposting {formatDate(selectedItem.createdAt)}
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
  container: { flex: 1, backgroundColor: '#080b14' },

  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { fontSize: 30, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.8 },
  subtitle: { fontSize: 12, color: '#6366f1', marginTop: 2, fontWeight: '700', letterSpacing: 0.5 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0d1117', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#1e2130', marginTop: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34d399' },
  headerBadgeText: { fontSize: 11, color: '#34d399', fontWeight: '700' },

  statRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 16 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0f1117', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#1e2130',
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statPillText: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 12,
    backgroundColor: '#0f1117', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#1e2130',
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, color: '#f1f5f9', fontSize: 14, fontWeight: '500' },
  clearBtn: { padding: 4 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 12 },
  filterBtn: {
    flex: 1, borderRadius: 14,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#1e2130',
    alignItems: 'center', overflow: 'hidden', minHeight: 40,
    justifyContent: 'center',
  },
  filterBtnAll: { borderColor: '#6366f1', backgroundColor: '#1e1b4b20' },
  filterBtnLost: { borderColor: '#ef4444', padding: 0 },
  filterBtnFound: { borderColor: '#34d399', padding: 0 },
  filterBtnGradient: { width: '100%', height: 40, justifyContent: 'center', alignItems: 'center' },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: '#6b7280', paddingVertical: 10 },
  filterBtnTextActive: { fontSize: 12, fontWeight: '700', color: '#f1f5f9' },

  catList: { paddingHorizontal: 24, paddingBottom: 14, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#0f1117', borderWidth: 1.5, borderColor: '#1e2130',
  },
  catChipActive: { backgroundColor: '#1e1b4b', borderColor: '#6366f1' },
  catChipText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  catChipTextActive: { color: '#818cf8' },

  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, gap: 12 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#1e1b4b20', borderWidth: 1, borderColor: '#6366f130',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },
  emptySubtitle: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  emptyBold: { fontWeight: '800', color: '#818cf8' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f1117', borderRadius: 18,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e2130',
  },
  cardPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  cardAccent: { width: 3, alignSelf: 'stretch' },
  cardThumb: { width: 76, height: 76 },
  cardThumbPlaceholder: { backgroundColor: '#141822', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12 },
  cardTypeRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeBadgeLost: { backgroundColor: '#450a0a', borderColor: '#ef444440' },
  typeBadgeFound: { backgroundColor: '#052e16', borderColor: '#34d39940' },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  resolvedBadge: { backgroundColor: '#1e1b4b40', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#6366f140' },
  resolvedText: { fontSize: 10, fontWeight: '700', color: '#818cf8' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  cardMetaDot: { fontSize: 11, color: '#374151' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalSheet: { backgroundColor: '#0f1117', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', borderWidth: 1, borderColor: '#1e2130' },
  modalImage: { width: '100%', height: 230, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalImagePlaceholder: { backgroundColor: '#141822', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: 8,
  },
  modalTypePill: {
    position: 'absolute', top: 16, left: 16,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  modalTypePillLost: { backgroundColor: 'rgba(127,29,29,0.85)' },
  modalTypePillFound: { backgroundColor: 'rgba(5,46,22,0.85)' },
  modalTypePillText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  modalContent: { padding: 22 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#f1f5f9', marginBottom: 14 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1e1b4b20', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderColor: '#6366f130',
  },
  tagText: { fontSize: 12, color: '#818cf8', fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  description: { fontSize: 14, color: '#cbd5e1', lineHeight: 24, marginBottom: 20 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#141822', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e2130', marginBottom: 20,
  },
  contactAvatar: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  contactAvatarText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  contactName: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  contactInfo: { fontSize: 13, color: '#818cf8', fontWeight: '600', marginTop: 2 },
  postedDate: { fontSize: 12, color: '#4b5563', fontWeight: '600', marginBottom: 40, textAlign: 'center' },
});
