import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/lib/firebase';
import { scheduleLocalNotification } from '@/lib/notifications';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email ?? user.uid);
      setUserId(user.uid);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'users', userId, 'todos'),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setTodos(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Todo, 'id'>),
        })),
      );
    });
    return unsubscribe;
  }, [userId]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [todos, searchQuery]);

  const onLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const onSaveTodo = async () => {
    const text = newTodoText.trim();
    if (!text || !userId) return;

    try {
      if (editingTodoId) {
        // UPDATE: Ganti Teks
        await updateDoc(doc(db, 'users', userId, 'todos', editingTodoId), {
          text: text,
        });
        
        if (Platform.OS === 'web') alert("Tugas berhasil diperbarui!");
        else Alert.alert('Sukses', 'Tugas berhasil diperbarui!');
      } else {
        // CREATE: Tambah Baru
        await addDoc(collection(db, 'users', userId, 'todos'), {
          text,
          done: false,
          createdAt: Date.now(),
        });

        if (Platform.OS !== 'web') {
          await scheduleLocalNotification('Tugas Baru!', text);
        }
      }

      setNewTodoText('');
      setEditingTodoId(null);
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      if (Platform.OS !== 'web') Alert.alert('Gagal', 'Gagal menyimpan data.');
      else alert("Gagal menyimpan data.");
    }
  };

  const onToggleDone = async (todo: Todo) => {
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId, 'todos', todo.id), {
      done: !todo.done,
    });
  };

  const onDelete = (todo: Todo) => {
    if (!userId) return;

    const performDelete = async () => {
      try {
        await deleteDoc(doc(db, 'users', userId, 'todos', todo.id));
      } catch (e: any) {
        if (Platform.OS === 'web') alert("Gagal hapus: " + e.message);
        else Alert.alert('Gagal Hapus', e.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Yakin hapus "${todo.text}"?`)) performDelete();
    } else {
      Alert.alert('Hapus Tugas', `Yakin hapus "${todo.text}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewTodoText('');
    setEditingTodoId(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">Todo List</ThemedText>
          <ThemedText style={styles.emailText}>{email}</ThemedText>
        </View>
        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari tugas..."
          placeholderTextColor="#94a3b8"
          style={[styles.searchInput, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#fff' : '#000' }]}
        />
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <View style={[styles.todoCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <ThemedText style={styles.indexText}>{index + 1}.</ThemedText>
            
            <Pressable style={[styles.check, item.done && styles.checked]} onPress={() => onToggleDone(item)}>
              {item.done && <ThemedText style={{ color: '#fff', fontSize: 10 }}>✓</ThemedText>}
            </Pressable>

            <ThemedText style={[styles.todoText, item.done && styles.todoDone, { color: isDark ? '#fff' : '#000' }]}>
              {item.text}
            </ThemedText>

            <Pressable 
              onPress={() => {
                setEditingTodoId(item.id);
                setNewTodoText(item.text);
                setModalVisible(true);
              }}
              style={{ marginRight: 15 }}
            >
              <ThemedText style={{ color: '#2563eb' }}>✎</ThemedText>
            </Pressable>

            <Pressable onPress={() => onDelete(item)} style={styles.deleteBtn}>
              <ThemedText style={{ color: '#ef4444' }}>✕</ThemedText>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <ThemedText type="subtitle">{editingTodoId ? 'Edit Tugas' : 'Tugas Baru'}</ThemedText>
            <TextInput
              ref={inputRef}
              value={newTodoText}
              onChangeText={setNewTodoText}
              autoFocus
              placeholder="Apa yang mau dikerjakan?"
              placeholderTextColor="#94a3b8"
              style={[styles.modalInput, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#334155' : '#e2e8f0' }]}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[styles.btn, { backgroundColor: '#e2e8f0' }]} onPress={closeModal}>
                <ThemedText style={{ color: '#000' }}>Batal</ThemedText>
              </Pressable>
              <Pressable style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={onSaveTodo}>
                <ThemedText style={{ color: '#fff' }}>Simpan</ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', padding: 20, paddingTop: 60, alignItems: 'center' },
  emailText: { fontSize: 12, color: '#64748b' },
  logoutBtn: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchInput: { padding: 12, borderRadius: 12, fontSize: 16 },
  todoCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  indexText: { marginRight: 10, fontWeight: 'bold', color: '#64748b' },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#2563eb', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#2563eb' },
  todoText: { flex: 1, fontSize: 16 },
  todoDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  deleteBtn: { padding: 5 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#fff', fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { padding: 20, borderRadius: 20 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 15, fontSize: 16 },
  btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' }
});