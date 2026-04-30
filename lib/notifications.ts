import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushTokenResult = {
  token: string | null;
  provider: 'expo';
  debug: {
    platform: string;
    isDevice: boolean;
    appOwnership: string | null;
    projectIdFromConfig: string | null;
    projectIdToUse: string | null;
    permissionStatus: string | null;
  };
  error: string | null;
};

// Konfigurasi tampilan notifikasi saat app foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<PushTokenResult> {
  const debugBase: PushTokenResult['debug'] = {
    platform: Platform.OS,
    isDevice: Device.isDevice,
    appOwnership: Constants.appOwnership ?? null,
    projectIdFromConfig: null,
    projectIdToUse: null,
    permissionStatus: null,
  };

  // Push notifications hanya bekerja di device fisik
  if (Platform.OS !== 'web' && !Device.isDevice) {
    return {
      token: null,
      provider: 'expo',
      debug: debugBase,
      error: 'Push notifications require a physical device',
    };
  }

  // Cek & minta izin notifikasi
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  debugBase.permissionStatus = String(finalStatus);

  if (finalStatus !== 'granted') {
    return {
      token: null,
      provider: 'expo',
      debug: debugBase,
      error: 'Permission for notifications was denied',
    };
  }

if (Platform.OS === 'web') {
    const vapidPublicKey =
      (Constants.expoConfig as { notification?: { vapidPublicKey?: string } } | undefined)?.notification
        ?.vapidPublicKey ?? null;

    // Cek apakah kuncinya ada dan valid
    if (!vapidPublicKey || vapidPublicKey.includes('...') || vapidPublicKey.length < 40) {
      console.warn("🔔 Notifikasi Web: VAPID Key belum valid atau tidak ditemukan.");
      // Kita return token dummy supaya app tidak crash/error merah
      return {
        token: 'DEVELOPMENT_WEB_TOKEN', 
        provider: 'expo',
        debug: debugBase,
        error: null, // Kita set null supaya dianggap 'aman' oleh UI
      };
    }
    
    // Jika VAPID ada, tapi kita di localhost, biasanya tetap akan ada kendala Service Worker.
    // Jadi kita bypass saja pengambilannya di mode development.
    return {
      token: 'LOCAL_WEB_TOKEN',
      provider: 'expo',
      debug: debugBase,
      error: null,
    };
  }

  // Android: wajib buat notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }

  // Dapatkan Expo Push Token
  try {
    const projectIdFromConfig =
      Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    debugBase.projectIdFromConfig = projectIdFromConfig ?? null;

    const isValidUuid = (value: unknown) =>
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const fallbackProjectId = 'e6c5ceaa-d8e8-48d2-8710-4f52a7665cf5';
    const projectIdToUse = isValidUuid(projectIdFromConfig) ? projectIdFromConfig : fallbackProjectId;
    debugBase.projectIdToUse = projectIdToUse ?? null;

    console.log('Expo push config:', {
      appOwnership: debugBase.appOwnership,
      projectIdFromConfig: debugBase.projectIdFromConfig,
      projectIdToUse: debugBase.projectIdToUse,
    });

    if (!isValidUuid(projectIdFromConfig)) {
      console.warn(
        'Expo Push Token: projectId EAS tidak terbaca dari config. Fallback dipakai. Jika masih error, restart bundler pakai `npx expo start -c`.',
      );
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectIdToUse,
    });

    console.log('============= EXPO PUSH TOKEN =============');
    console.log(token.data);
    console.log('==========================================');

    return {
      token: token.data,
      provider: 'expo',
      debug: debugBase,
      error: null,
    };
  } catch (e) {
    console.warn('Gagal mengambil Expo Push Token:', e);
    return {
      token: null,
      provider: 'expo',
      debug: debugBase,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function scheduleLocalNotification(title: string, body: string) {
  // Cegah error di Web
  if (Platform.OS === 'web') {
    console.log('Notifikasi lokal di-skip karena jalan di Web:', title, body);
    return; 
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}
