import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPEN_COUNT = 'review_open_count';
const DONE = 'review_requested';

/**
 * Ask for an in-app rating at a positive moment (e.g. viewing progress/insights).
 * Fires once, only after the user is clearly engaged. The OS also rate-limits the
 * native prompt, so this is safe to call repeatedly.
 */
export async function maybeRequestReview() {
  try {
    if (await AsyncStorage.getItem(DONE)) return;
    const n = parseInt((await AsyncStorage.getItem(OPEN_COUNT)) || '0', 10) + 1;
    await AsyncStorage.setItem(OPEN_COUNT, String(n));
    if (n < 2) return;                            // engaged = came back to view progress
    if (!(await StoreReview.isAvailableAsync())) return;
    await StoreReview.requestReview();            // native in-app rating dialog
    await AsyncStorage.setItem(DONE, '1');
  } catch { /* never block the UI on a rating prompt */ }
}
