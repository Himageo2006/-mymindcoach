import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SERVER_URL = 'https://mindtalk-server-production.up.railway.app';
const APP_KEY    = 'mk-app-2024-xK9pL3mNqR7vW2jT';

// ─── Keys ────────────────────────────────────────────────────────────────────
const PREMIUM_KEY      = 'is_premium';
const PLAN_KEY         = 'active_plan';       // 'free' | 'pro_monthly' | 'pro_annual'
const MSG_COUNT_KEY    = 'daily_msg_count';
const MSG_DATE_KEY     = 'daily_msg_date';
const JOURNAL_COUNT_KEY = 'weekly_journal_count';
const JOURNAL_WEEK_KEY  = 'weekly_journal_week';

// ─── Plan definitions ─────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    price: '$0',
    messagesPerDay: 20,
    journalPerWeek: 3,
    voiceMessages: false,
    allCoaches: false,
    moodHistoryDays: 7,
    model: 'haiku',              // server ignores this for free users (uses Gemini)
  },
  pro_monthly: {
    id: 'pro_monthly',
    label: 'Pro',
    price: '$12.99/mo',
    messagesPerDay: 300,         // ↑ from 100 — Claude smart routing
    journalPerWeek: Infinity,
    voiceMessages: true,
    allCoaches: true,
    moodHistoryDays: 90,
    model: 'sonnet',
  },
  pro_annual: {
    id: 'pro_annual',
    label: 'Pro Annual',
    price: '$59.99/yr',
    messagesPerDay: 500,         // ↑ from 100 — Claude Sonnet priority
    journalPerWeek: Infinity,
    voiceMessages: true,
    allCoaches: true,
    moodHistoryDays: 90,
    model: 'sonnet',
  },
};

// Keep backward-compat alias
export const FREE_LIMITS = {
  messagesPerDay: PLANS.free.messagesPerDay,
  journalPerWeek: PLANS.free.journalPerWeek,
};

// ─── RevenueCat ──────────────────────────────────────────────────────────────
let Purchases = null;

// Android SDK key (Test Store — replace with real Google Play key after connecting Play in RC)
const RC_ANDROID_KEY = 'test_lfCrAoJpNkemTMsbvfeXQjEpklp';

export async function initRevenueCat() {
  if (Platform.OS === 'web') return;
  try {
    const rc = await import('react-native-purchases');
    Purchases = rc.default;
    await Purchases.configure({ apiKey: RC_ANDROID_KEY });
  } catch (e) {
    console.log('[RC] init failed:', e.message);
  }
}

// ─── Plan detection ───────────────────────────────────────────────────────────

/** Returns 'free' | 'pro_monthly' | 'pro_annual' */
export async function getActivePlan() {
  if (Platform.OS === 'web') return 'free';
  if (!Purchases) return 'free';
  try {
    const info = await Purchases.getCustomerInfo();
    const active = info.entitlements.active;
    if (!active || Object.keys(active).length === 0) return 'free';
    const proEntitlement = active['pro'];
    if (proEntitlement) {
      const productId = proEntitlement.productIdentifier || '';
      if (productId.includes('annual') || productId.includes('yearly')) return 'pro_annual';
      return 'pro_monthly';
    }
    return 'pro_monthly';
  } catch {
    return 'free';
  }
}

/** Convenience — true if any paid plan active */
export async function isPremium() {
  const plan = await getActivePlan();
  return plan !== 'free';
}

/** Returns the full plan config object */
export async function getPlanConfig() {
  const planId = await getActivePlan();
  return PLANS[planId] || PLANS.free;
}

// ─── Offerings ───────────────────────────────────────────────────────────────
export async function getOfferings() {
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current || null;
  } catch {
    return null;
  }
}

/** pkg = PurchasesPackage from getOfferings() */
export async function purchasePremium(pkg) {
  if (!Purchases) throw new Error('RevenueCat not initialized');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  try {
    await fetchAndStoreSubToken(customerInfo.originalAppUserId);
  } catch (e) {
    console.warn('[RC] token fetch failed after purchase:', e.message);
  }
  return customerInfo;
}

export async function restorePurchases() {
  if (!Purchases) throw new Error('RevenueCat not initialized');
  const customerInfo = await Purchases.restorePurchases();
  try {
    await fetchAndStoreSubToken(customerInfo.originalAppUserId);
  } catch (e) {
    console.warn('[RC] token fetch failed after restore:', e.message);
  }
  return customerInfo;
}

// ─── Usage tracking ──────────────────────────────────────────────────────────
export async function canSendMessage() {
  const plan = await getPlanConfig();
  if (plan.messagesPerDay === Infinity) return { allowed: true, remaining: Infinity };

  const today = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem(MSG_DATE_KEY);
  let count = 0;

  if (savedDate === today) {
    count = parseInt(await AsyncStorage.getItem(MSG_COUNT_KEY) || '0');
  } else {
    await AsyncStorage.setItem(MSG_DATE_KEY, today);
    await AsyncStorage.setItem(MSG_COUNT_KEY, '0');
  }

  const remaining = plan.messagesPerDay - count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function incrementMessageCount() {
  const today = new Date().toDateString();
  await AsyncStorage.setItem(MSG_DATE_KEY, today);
  const count = parseInt(await AsyncStorage.getItem(MSG_COUNT_KEY) || '0');
  await AsyncStorage.setItem(MSG_COUNT_KEY, String(count + 1));
}

export async function canWriteJournal() {
  const plan = await getPlanConfig();
  if (plan.journalPerWeek === Infinity) return { allowed: true, remaining: Infinity };

  const week = getWeekNumber();
  const savedWeek = await AsyncStorage.getItem(JOURNAL_WEEK_KEY);
  let count = 0;

  if (savedWeek === String(week)) {
    count = parseInt(await AsyncStorage.getItem(JOURNAL_COUNT_KEY) || '0');
  } else {
    await AsyncStorage.setItem(JOURNAL_WEEK_KEY, String(week));
    await AsyncStorage.setItem(JOURNAL_COUNT_KEY, '0');
  }

  const remaining = plan.journalPerWeek - count;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function incrementJournalCount() {
  const week = getWeekNumber();
  await AsyncStorage.setItem(JOURNAL_WEEK_KEY, String(week));
  const count = parseInt(await AsyncStorage.getItem(JOURNAL_COUNT_KEY) || '0');
  await AsyncStorage.setItem(JOURNAL_COUNT_KEY, String(count + 1));
}

// ─── Secure token storage (anti-jailbreak layer) ─────────────────────────────
// Sub-tokens are stored in expo-secure-store (iOS Keychain / Android Keystore),
// NOT AsyncStorage — so they survive app reinstall but can't be read/edited on
// rooted devices the way AsyncStorage can.

const SECURE_SUB_TOKEN = 'mkt_sub_token';
const SECURE_DEVICE_ID = 'mkt_device_id';

/**
 * Returns the server-issued subscription token, or '' if none stored.
 */
export async function getSubToken() {
  try {
    return (await SecureStore.getItemAsync(SECURE_SUB_TOKEN)) || '';
  } catch { return ''; }
}

/**
 * Saves a subscription token to secure storage.
 */
export async function storeSubToken(token) {
  try { await SecureStore.setItemAsync(SECURE_SUB_TOKEN, token); }
  catch (e) { console.warn('[SecureStore] storeSubToken failed:', e.message); }
}

/**
 * Removes the subscription token (call on logout or subscription cancel).
 */
export async function clearSubToken() {
  try { await SecureStore.deleteItemAsync(SECURE_SUB_TOKEN); }
  catch { }
}

/**
 * Returns a stable, per-device ID.  Generated once and stored in SecureStore.
 * Used to bind subscription tokens to a device so tokens can't be shared.
 */
export async function getDeviceId() {
  try {
    let id = await SecureStore.getItemAsync(SECURE_DEVICE_ID);
    if (!id) {
      // Generate a random ID and persist it permanently
      const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      id = `mk-${rand}-${Date.now().toString(36)}`;
      await SecureStore.setItemAsync(SECURE_DEVICE_ID, id);
    }
    return id;
  } catch {
    // Fallback if SecureStore unavailable (simulators sometimes)
    return `fallback-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * After a successful RevenueCat purchase, call this to get a server-verified
 * subscription token and store it in SecureStore.
 *
 * rcUserId — RevenueCat originalAppUserId from customerInfo
 */
export async function fetchAndStoreSubToken(rcUserId) {
  const deviceId = await getDeviceId();
  const res = await fetch(`${SERVER_URL}/api/issue-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-key': APP_KEY,
    },
    body: JSON.stringify({
      rcUserId,
      platform: Platform.OS,
      deviceId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Token issue failed: ${res.status}`);
  }
  const { token } = await res.json();
  await storeSubToken(token);
  return token;
}

function getWeekNumber() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// ─── Web / testing helpers ───────────────────────────────────────────────────
export async function setWebPremium(value, plan = 'pro_monthly') {
  await AsyncStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
  await AsyncStorage.setItem(PLAN_KEY, value ? plan : 'free');
}

/** Resets daily message counter — useful for testing */
export async function resetMessageCount() {
  await AsyncStorage.setItem(MSG_COUNT_KEY, '0');
  // Set date to yesterday so the counter auto-resets on next canSendMessage() call
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await AsyncStorage.setItem(MSG_DATE_KEY, yesterday.toDateString());
}
