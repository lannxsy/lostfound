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
import React, { useEffect, useState, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '../lib/firebase';
import { scheduleLocalNotification } from '../lib/notifications';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  deadline?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';

  const [userId, setUserId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [todoText, setTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const completedCount = useMemo(() => todos.filter((t) => t.done).length, [todos]);
  const totalCount = todos.length;
  const progressWidth = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) { router.replace('/login'); return; }
      setUserId(user.uid);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'users', userId, 'todos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Todo, 'id'>) })));
    });
    return unsubscribe;
  }, [userId]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => todo.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [todos, searchQuery]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTodoText('');
    setDeadline(new Date());
    setModalVisible(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingId(todo.id);
    setTodoText(todo.text);
    setDeadline(todo.deadline ? new Date(todo.deadline) : new Date());
    setModalVisible(true);
  };

  const onSaveTodo = async () => {
    const text = todoText.trim();
    if (!text || !userId) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', userId, 'todos', editingId), {
          text,
          deadline: deadline.getTime(),
        });
        Alert.alert('Success', 'Mission updated! 🛡️');
      } else {
        await addDoc(collection(db, 'users', userId, 'todos'), {
          text,
          done: false,
          createdAt: Date.now(),
          deadline: deadline.getTime(),
        });
        Alert.alert('Order Received', 'New mission assigned! 🚀');
        if (Platform.OS !== 'web' && deadline.getTime() > Date.now()) {
          await scheduleLocalNotification('Mission Alert!', text);
        }
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to communicate with HQ.');
    }
  };

  const confirmDelete = (todoId: string) => {
    Alert.alert(
      'Terminate Mission?',
      'Are you sure you want to delete this mission from the archives?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Terminate', 
          style: 'destructive', 
          onPress: async () => {
            if (!userId) return;
            try {
              await deleteDoc(doc(db, 'users', userId, 'todos', todoId));
              if (Platform.OS !== 'ios') {
                Alert.alert('Deleted', 'Mission record destroyed. 🗑️');
              }
            } catch (e) {
              Alert.alert('Error', 'Termination failed.');
            }
          } 
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Ionicons name="umbrella" size={40} color="#ef4444" style={styles.umbrellaLogo} />
          <View>
            <ThemedText style={styles.dateLabel}>Umbrella Corporation</ThemedText>
            <ThemedText type="title" style={styles.title}>Umbrella Task</ThemedText>
          </View>
        </View>
        <Pressable style={styles.logoutIcon} onPress={() => signOut(auth)}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </Pressable>
      </View>

      <View style={[styles.progressCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressText}>{completedCount}/{totalCount} Mission Clear</ThemedText>
          <ThemedText style={styles.progressText}>{Math.round(progressWidth)}%</ThemedText>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput 
          placeholder="Search mission..." 
          style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isOverdue = item.deadline && item.deadline < Date.now() && !item.done;
          return (
            <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <Pressable 
                onPress={() => userId && updateDoc(doc(db, 'users', userId, 'todos', item.id), { done: !item.done })}
                style={[styles.checkBtn, item.done && styles.checkBtnActive]}
              >
                {item.done && <Ionicons name="checkmark" size={16} color="white" />}
              </Pressable>
              
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.todoText, item.done && styles.todoTextDone]}>{item.text}</ThemedText>
                {item.deadline && (
                  <View style={styles.deadlineRow}>
                    <Ionicons name="time-outline" size={14} color={isOverdue ? '#ef4444' : '#64748b'} />
                    <ThemedText style={[styles.deadlineText, isOverdue ? { color: '#ef4444' } : null]}>
                      {new Date(item.deadline).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <Pressable onPress={() => openEditModal(item)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={20} color="#2563eb" />
                </Pressable>
                <Pressable onPress={() => confirmDelete(item.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#0f172a' : '#fff' }]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <ThemedText style={styles.modalTitle}>{editingId ? 'Update Mission' : 'New Assignment'}</ThemedText>
              
              <ThemedText style={styles.label}>Objective Details:</ThemedText>
              <TextInput
                placeholder="Enter objective..."
                style={[styles.modalInput, { 
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#334155' : '#e2e8f0' 
                }]}
                value={todoText}
                onChangeText={setTodoText}
                multiline
                placeholderTextColor="#94a3b8"
              />

              <ThemedText style={styles.label}>Deadline Schedule:</ThemedText>
              <View style={styles.pickerRow}>
                <Pressable style={[styles.pickerBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} onPress={() => { setPickerMode('date'); setShowPicker(true); }}>
                  <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                  <ThemedText style={styles.pickerBtnText}>{deadline.toLocaleDateString('id-ID')}</ThemedText>
                </Pressable>
                <Pressable style={[styles.pickerBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} onPress={() => { setPickerMode('time'); setShowPicker(true); }}>
                  <Ionicons name="time-outline" size={18} color="#2563eb" />
                  <ThemedText style={styles.pickerBtnText}>{deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                </Pressable>
              </View>

              {showPicker && (
                <DateTimePicker
                  value={deadline}
                  mode={pickerMode}
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <ThemedText style={{ color: '#64748b', fontWeight: '600' }}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={onSaveTodo}>
                  <ThemedText style={styles.saveBtnText}>Confirm Mission</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  umbrellaLogo: { marginRight: 12 },
  dateLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900' },
  logoutIcon: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 12 },
  progressCard: { marginHorizontal: 25, padding: 20, borderRadius: 24, marginBottom: 20, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ef4444' }, // Red theme for Umbrella
  searchBar: { marginHorizontal: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 16, height: 50, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { paddingHorizontal: 25, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, elevation: 1 },
  checkBtn: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#ef4444', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkBtnActive: { backgroundColor: '#ef4444' },
  todoText: { fontSize: 16, fontWeight: '600' },
  todoTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  deadlineText: { fontSize: 12, color: '#64748b' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 5 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 20, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalSheet: { borderRadius: 24, padding: 25, maxHeight: '90%' },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 10 },
  modalInput: { fontSize: 16, borderWidth: 1.5, borderRadius: 12, padding: 15, minHeight: 80, textAlignVertical: 'top', marginBottom: 10 },
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pickerBtn: { flex: 1, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerBtnText: { fontWeight: '700', color: '#ef4444' },
  modalActions: { flexDirection: 'column', gap: 10, marginTop: 10 },
  saveBtn: { backgroundColor: '#ef4444', padding: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: 'center' },
});