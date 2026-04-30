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
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/lib/firebase';
import { scheduleLocalNotification } from '@/lib/notifications'; // [BARU]

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
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

  const onLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const onAddTodo = async () => {
    const text = newTodoText.trim();
    if (!text || !userId) return;
    await addDoc(collection(db, 'users', userId, 'todos'), {
      text,
      done: false,
      createdAt: Date.now(),
    });

    // [BARU] Kirim local notification sebagai konfirmasi
    await scheduleLocalNotification('Todo Ditambahkan!', `"${text}" berhasil disimpan.`);

    setNewTodoText('');
    setModalVisible(false);
  };

  const onToggleDone = async (todo: Todo) => {
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId, 'todos', todo.id), {
      done: !todo.done,
    });
  };

  const onDelete = (todo: Todo) => {
    if (!userId) return;
    Alert.alert('Hapus Todo', `Hapus "${todo.text}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'users', userId, 'todos', todo.id)),
      },
    ]);
  };

  const closeModal = () => {
    setModalVisible(false);
    setNewTodoText('');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Todo List</ThemedText>
          <ThemedText style={styles.emailText}>{email ?? '-'}</ThemedText>
        </View>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <ThemedText type="defaultSemiBold" style={styles.logoutText}>
            Logout
          </ThemedText>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Belum ada todo.{'\n'}Tekan + untuk menambah.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.todoItem, item.done && styles.todoItemDone]}>
            <Pressable onPress={() => onToggleDone(item)} style={styles.checkboxWrap}>
              <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
                {item.done && <ThemedText style={styles.checkmark}>✓</ThemedText>}
              </View>
            </Pressable>

            <ThemedText
              style={[styles.todoText, item.done && styles.todoTextDone]}
              numberOfLines={2}>
              {item.text}
            </ThemedText>

            <Pressable onPress={() => onDelete(item)} style={styles.deleteWrap}>
              <ThemedText style={styles.deleteText}>✕</ThemedText>
            </Pressable>
          </View>
        )}
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </Pressable>

      {/* Add Todo Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.overlayBackdrop} onPress={closeModal} />
          <View style={styles.modalCard}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Tambah Todo
            </ThemedText>
            <TextInput
              ref={inputRef}
              value={newTodoText}
              onChangeText={setNewTodoText}
              placeholder="Tulis todomu di sini..."
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              onSubmitEditing={onAddTodo}
              returnKeyType="done"
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={closeModal}>
                <ThemedText type="defaultSemiBold">Batal</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.addBtn]} onPress={onAddTodo}>
                <ThemedText type="defaultSemiBold" style={styles.addBtnText}>
                  Tambah
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  emailText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  todoItemDone: {
    opacity: 0.5,
  },
  checkboxWrap: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoText: {
    flex: 1,
    fontSize: 15,
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  deleteWrap: {
    marginLeft: 12,
    padding: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 16,
    color: '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  addBtn: {
    backgroundColor: '#2563eb',
  },
  addBtnText: {
    color: '#ffffff',
  },
});
