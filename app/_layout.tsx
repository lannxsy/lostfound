import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // [BARU] Refs untuk listener notifikasi
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  // [BARU] Setup push notifications saat app pertama kali dibuka
  useEffect(() => {
    // Listener: notifikasi diterima saat app foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notifikasi diterima:', notification);
        const title = notification.request.content.title ?? 'Notifikasi Baru';
        const body = notification.request.content.body ?? 'Pesan masuk tanpa isi.';
        Alert.alert(title, body);
      },
    );

    // Listener: user menekan notifikasi
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notifikasi diklik:', response);
        const title = response.notification.request.content.title ?? 'Notifikasi Dibuka';
        const body = response.notification.request.content.body ?? 'User membuka notifikasi.';
        Alert.alert(title, body);
        // Bisa navigasi ke screen tertentu di sini
      },
    );

    // Cleanup listener saat component unmount
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
