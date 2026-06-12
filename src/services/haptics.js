import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export function tapLight() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function tapMedium() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function tapHeavy() {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function success() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warning() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function error() {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
