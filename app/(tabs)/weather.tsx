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
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import {
  collection, deleteDoc, doc, onSnapshot,
  orderBy, query, updateDoc, where,
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
    Alert.alert(
      newStatus === 'resolved' ? 'Tandai Selesai?' : 'Buka Kembali?',
      newStatus === 'resolved' ? 'Tandai laporan ini sebagai selesai?' : 'Buka kembali laporan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya', onPress: async () => {
            await updateDoc(doc(db, 'lostfound', item.id), { status: newStatus });
            setSelectedItem(null);
          }
        }
      ]
    );
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

  const openCount = myPosts.filter((p) => p.status === 'open').length;
  const resolvedCount = myPosts.filter((p) => p.status === 'resolved').length;

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#6366f1', '#3b82f6']} style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</ThemedText>
          </LinearGradient>
          <View>
            <ThemedText style={styles.greeting}>Halo, {userName} 👋</ThemedText>
            <ThemedText style={styles.title}>Postingan Saya</ThemedText>
          </View>
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </Pressable>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statNumber}>{myPosts.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
        <View style={[styles.statCard, styles.statCardMid]}>
          <ThemedText style={[styles.statNumber, { color: '#fbbf24' }]}>{openCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Aktif</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={[styles.statNumber, { color: '#34d399' }]}>{resolvedCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Selesai</ThemedText>
        </View>
      </View>

      {/* LIST */}
      {myPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="document-text-outline" size={40} color="#6366f1" />
          </View>
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
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
              onPress={() => setSelectedItem(item)}
            >
              <View style={[styles.cardAccent, { backgroundColor: item.type === 'lost' ? '#ef4444' : '#34d399' }]} />
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardThumb} />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbPlaceholder]}>
                  <Ionicons name="image-outline" size={22} color="#374151" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <View style={styles.cardBadgeRow}>
                  <View style={[
                    styles.typeBadge,
                    item.type === 'lost' ? styles.typeBadgeLost : styles.typeBadgeFound
                  ]}>
                    <ThemedText style={[styles.typeBadgeText, { color: item.type === 'lost' ? '#fca5a5' : '#6ee7b7' }]}>
                      {item.type === 'lost' ? '● Hilang' : '● Ditemukan'}
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'resolved' ? styles.statusBadgeResolved : styles.statusBadgeOpen
                  ]}>
                    <ThemedText style={[
                      styles.statusBadgeText,
                      item.status === 'resolved' ? styles.statusTextResolved : styles.statusTextOpen
                    ]}>
                      {item.status === 'open' ? '● Aktif' : '● Selesai'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.cardTitle} numberOfLines={1}>{item.title}</ThemedText>
                <View style={styles.cardMeta}>
                  <Ionicons name="location-outline" size={11} color="#6b7280" />
                  <ThemedText style={styles.cardMetaText}>{item.location} · {formatDate(item.createdAt)}</ThemedText>
                </View>
              </View>
              <Pressable onPress={() => deletePost(item)} style={styles.deleteBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={17} color="#374151" />
              </Pressable>
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
                <Pressable style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>

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

                  {/* ACTION BUTTONS */}
                  <Pressable
                    onPress={() => toggleStatus(selectedItem)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                  >
                    <LinearGradient
                      colors={selectedItem.status === 'resolved' ? ['#1e3a5f', '#3b82f6'] : ['#052e16', '#16a34a']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name={selectedItem.status === 'resolved' ? 'refresh-outline' : 'checkmark-circle-outline'}
                        size={18} color="#fff"
                      />
                      <ThemedText style={styles.actionBtnText}>
                        {selectedItem.status === 'resolved' ? 'Buka Kembali' : 'Tandai Selesai'}
                      </ThemedText>
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={styles.deleteBtnModal} onPress={() => deletePost(selectedItem)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <ThemedText style={styles.deleteBtnModalText}>Hapus Laporan</ThemedText>
                  </Pressable>

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
    paddingTop: 60, paddingHorizontal: 22, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  greeting: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.4 },
  logoutBtn: {
    backgroundColor: '#1a0a0a', padding: 10, borderRadius: 14,
    borderWidth: 1, borderColor: '#ef444430',
  },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 22, marginBottom: 20,
    backgroundColor: '#0f1117', borderRadius: 20, padding: 4,
    borderWidth: 1, borderColor: '#1e2130', gap: 2,
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
  },
  statCardMid: {
    backgroundColor: '#141822',
    borderRadius: 14,
  },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#818cf8' },
  statLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

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
  cardAccent: { width: 3, alignSelf: 'stretch' },
  cardThumb: { width: 72, height: 72 },
  cardThumbPlaceholder: { backgroundColor: '#141822', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 12 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeBadgeLost: { backgroundColor: '#450a0a', borderColor: '#ef444440' },
  typeBadgeFound: { backgroundColor: '#052e16', borderColor: '#34d39940' },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusBadgeOpen: { backgroundColor: '#1c1200', borderColor: '#fbbf2440' },
  statusBadgeResolved: { backgroundColor: '#1e1b4b40', borderColor: '#818cf840' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  statusTextOpen: { color: '#fbbf24' },
  statusTextResolved: { color: '#818cf8' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  deleteBtn: { padding: 16 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalSheet: {
    backgroundColor: '#0f1117', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%', borderWidth: 1, borderColor: '#1e2130',
  },
  modalImage: { width: '100%', height: 220, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  modalImagePlaceholder: { backgroundColor: '#141822', justifyContent: 'center', alignItems: 'center' },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: 8,
  },
  modalContent: { padding: 22 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#f1f5f9', marginBottom: 14 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1e1b4b20', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderColor: '#6366f130',
  },
  tagText: { fontSize: 12, color: '#818cf8', fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  description: { fontSize: 14, color: '#cbd5e1', lineHeight: 24, marginBottom: 22 },

  actionBtn: {
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  deleteBtnModal: {
    borderRadius: 16, paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#ef444430', marginBottom: 20,
  },
  deleteBtnModalText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  postedDate: { fontSize: 12, color: '#4b5563', fontWeight: '600', textAlign: 'center', marginBottom: 40 },
});
