import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '../lib/firebase';
import type { LostFoundItem } from './index';

export default function MyPostsScreen() {
  const [myPosts, setMyPosts] = useState<LostFoundItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [userName, setUserName] = useState('Pengguna');

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setUserName(user.displayName || user.email?.split('@')[0] || 'Pengguna');
  }, []);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'lostfound'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setMyPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LostFoundItem, 'id'>) })));
    });
  }, [userId]);

  const toggleStatus = async (item: LostFoundItem) => {
    const newStatus = item.status === 'open' ? 'resolved' : 'open';
    const label = newStatus === 'resolved' ? 'Tandai Selesai?' : 'Buka Kembali?';
    const msg = newStatus === 'resolved'
      ? 'Tandai laporan ini sebagai selesai/barang sudah ditemukan pemiliknya?'
      : 'Buka kembali laporan ini?';

    Alert.alert(label, msg, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya', onPress: async () => {
          await updateDoc(doc(db, 'lostfound', item.id), { status: newStatus });
          setSelectedItem(null);
        }
      }
    ]);
  };

  const deletePost = (item: LostFoundItem) => {
    Alert.alert('Hapus Laporan?', 'Laporan ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'lostfound', item.id));
          setSelectedItem(null);
        }
      }
    ]);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const typeColor = (type: 'lost' | 'found') => type === 'lost' ? '#ef4444' : '#3b82f6';
  const typeLabel = (type: 'lost' | 'found') => type === 'lost' ? '🔴 Hilang' : '🔵 Ditemukan';

  const openCount = myPosts.filter((p) => p.status === 'open').length;
  const resolvedCount = myPosts.filter((p) => p.status === 'resolved').length;

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title}>Milik Saya</ThemedText>
          <ThemedText style={styles.subtitle}>Halo, {userName} 👋</ThemedText>
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={20} color="#3b82f6" />
        </Pressable>
      </View>

      {/* STAT CARD */}
      <View style={styles.statCard}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{myPosts.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Laporan</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: '#f59e0b' }]}>{openCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Masih Aktif</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: '#4ade80' }]}>{resolvedCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Selesai</ThemedText>
        </View>
      </View>

      {/* LIST */}
      {myPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyEmoji}>📋</ThemedText>
          <ThemedText style={styles.emptyTitle}>Belum Ada Laporan</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tap tab <ThemedText style={styles.emptyBold}>Lapor</ThemedText> untuk buat laporan{'\n'}barang hilang atau yang kamu temukan
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={myPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelectedItem(item)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color="#4b5563" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <View style={styles.cardBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor(item.type) + '20', borderColor: typeColor(item.type) + '60' }]}>
                    <ThemedText style={[styles.typeBadgeText, { color: typeColor(item.type) }]}>
                      {typeLabel(item.type)}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, item.status === 'resolved' && styles.statusBadgeResolved]}>
                    <ThemedText style={[styles.statusBadgeText, item.status === 'resolved' && styles.statusBadgeTextResolved]}>
                      {item.status === 'open' ? '🟡 Aktif' : '✅ Selesai'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={11} color="#4b5563" />
                  <ThemedText style={styles.cardMetaText}>{item.location} · {formatDate(item.createdAt)}</ThemedText>
                </View>
              </View>
              <Pressable onPress={() => deletePost(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#4b5563" />
              </Pressable>
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
                  <ThemedText style={styles.description}>
                    {selectedItem.description || 'Tidak ada deskripsi.'}
                  </ThemedText>

                  {/* ACTION BUTTONS */}
                  <Pressable
                    style={[styles.actionBtn, selectedItem.status === 'resolved' ? styles.actionBtnReopen : styles.actionBtnResolve]}
                    onPress={() => toggleStatus(selectedItem)}
                  >
                    <Ionicons
                      name={selectedItem.status === 'resolved' ? 'refresh-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color="#fff"
                    />
                    <ThemedText style={styles.actionBtnText}>
                      {selectedItem.status === 'resolved' ? 'Buka Kembali' : 'Tandai Selesai'}
                    </ThemedText>
                  </Pressable>

                  <Pressable style={styles.deleteBtnModal} onPress={() => deletePost(selectedItem)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <ThemedText style={styles.deleteBtnModalText}>Hapus Laporan</ThemedText>
                  </Pressable>

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
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#3b82f6', marginTop: 2, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#1a1a1a', padding: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#1f2937',
  },
  statCard: {
    marginHorizontal: 24, backgroundColor: '#111', borderRadius: 20,
    flexDirection: 'row', padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#1f2937',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#3b82f6' },
  statLabel: { fontSize: 10, color: '#4b5563', fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#1f2937' },
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
  cardThumb: { width: 76, height: 76 },
  cardThumbPlaceholder: { backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: '#2a2200', borderWidth: 1, borderColor: '#f59e0b60' },
  statusBadgeResolved: { backgroundColor: '#1a2a1a', borderColor: '#4ade8060' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#f59e0b' },
  statusBadgeTextResolved: { color: '#4ade80' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
  deleteBtn: { padding: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  modalImage: { width: '100%', height: 200, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
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
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  description: { fontSize: 14, color: '#d1d5db', lineHeight: 24, marginBottom: 24 },
  actionBtn: {
    borderRadius: 16, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  actionBtnResolve: { backgroundColor: '#166534' },
  actionBtnReopen: { backgroundColor: '#1e3a5f' },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  deleteBtnModal: {
    borderRadius: 16, paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: '#ef444440', marginBottom: 20,
  },
  deleteBtnModalText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  postedDate: { fontSize: 12, color: '#4b5563', fontWeight: '600', textAlign: 'center', marginBottom: 40 },
});