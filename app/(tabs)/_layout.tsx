import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/firebase';

export default function TabLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(Boolean(user));
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  if (!isReady) return null;
  if (!isLoggedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#4b5563',
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#1f2937',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerShown: false,
      }}>

      {/* Tab 1: Feed - semua laporan */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="search-outline" color={color} />
          ),
        }}
      />

      {/* Tab 2: Lapor - post barang hilang/ketemu */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Lapor',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="camera-outline" color={color} />
          ),
        }}
      />

      {/* Tab 3: Milik Saya - postingan sendiri */}
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Milik Saya',
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}