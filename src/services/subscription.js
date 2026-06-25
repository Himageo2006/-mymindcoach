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
const EXTRA_MSG_KEY    = 'extra_msg_balance';   // purchased pay-as-you-go messages (does NOT reset daily)
const JOURNAL_COUNT_KEY = 'weekly_journal_count';
const JOURNAL_WEEK_KEY  = 'weekly_journal_week';

// ─── Pay-as-you-go message pack (consumable IAP) ─────────────────────────────
// Same product ID must exist in App Store Connect + Play Console (consumable type)
// and be registered in RevenueCat.
export const MSG_PACK = {
  productId: 'mt_msg_pack_100',   // Play PRODUCT ID (underscores) & App Store product ID — must match both stores
  messages: 100,
};

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

const RC_ANDROID_KEY = 'goog_dlgPJbtRNqbqLNrNVovPAEPWcGu';
const RC_IOS_KEY     = 'appl_jkKvhEwbuGEDctNTaeGxrgprGVm';

export async function initRevenueCat() {
  if (Platform.OS === 'web') return;
  try {
    const rc = await import('react-native-purchases');
    Purchases = rc.default;
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    await Purchases.configure({ apiKey });
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

/** Returns the message-pack store product (for showing localized price), or null. */
export async function getMessagePackProduct() {
  if (!Purchases) return null;
  try {
    const products = await Purchases.getProducts(
      [MSG_PACK.productId],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    return products && products.length ? products[0] : null;
  } catch {
    return null;
  }
}

/**
 * Buys the pay-as-you-go consumable pack and credits MSG_PACK.messages locally.
 * Throws on cancel/failure (purchaseStoreProduct rejects). Returns the new balance.
 */
export async function buyMessagePack() {
  if (!Purchases) throw new Error('RevenueCat not initialized');
  const product = await getMessagePackProduct();
  if (!product) throw new Error('Message pack not available');
  await Purchases.purchaseStoreProduct(product); // resolves only on a completed purchase
  return addExtraMessages(MSG_PACK.messages);
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

// ─── Pay-as-you-go balance ───────────────────────────────────────────────────
/** Purchased extra messages remaining (persists across days until used). */
export async function getExtraBalance() {
  return parseInt(await AsyncStorage.getItem(EXTRA_MSG_KEY) || '0', 10) || 0;
}

/** Credit purchased messages (call after a successful pack purchase). */
export async function addExtraMessages(n) {
  const balance = await getExtraBalance();
  await AsyncStorage.setItem(EXTRA_MSG_KEY, String(balance + n));
  return balance + n;
}

// ─── Usage tracking ──────────────────────────────────────────────────────────
// Returns:
//   remaining  — today's free/plan messages left (drives the countdown banner)
//   extra      — purchased pay-as-you-go messages left
//   allowed    — can send if EITHER bucket has room
export async function canSendMessage() {
  const plan = await getPlanConfig();
  const extra = await getExtraBalance();
  if (plan.messagesPerDay === Infinity) return { allowed: true, remaining: Infinity, extra };

  const today = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem(MSG_DATE_KEY);
  let count = 0;

  if (savedDate === today) {
    count = parseInt(await AsyncStorage.getItem(MSG_COUNT_KEY) || '0');
  } else {
    await AsyncStorage.setItem(MSG_DATE_KEY, today);
    await AsyncStorage.setItem(MSG_COUNT_KEY, '0');
  }

  const remaining = Math.max(0, plan.messagesPerDay - count);
  return { allowed: remaining > 0 || extra > 0, remaining, extra };
}

// Spends one message: free/plan allowance first, then the purchased pack balance.
export async function incrementMessageCount() {
  const plan = await getPlanConfig();
  const today = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem(MSG_DATE_KEY);
  const count = (savedDate === today)
    ? parseInt(await AsyncStorage.getItem(MSG_COUNT_KEY) || '0', 10)
    : 0;

  const dailyLimit = plan.messagesPerDay; // may be Infinity
  if (count < dailyLimit) {
    await AsyncStorage.setItem(MSG_DATE_KEY, today);
    await AsyncStorage.setItem(MSG_COUNT_KEY, String(count + 1));
  } else {
    const extra = await getExtraBalance();
    if (extra > 0) await AsyncStorage.setItem(EXTRA_MSG_KEY, String(extra - 1));
  }
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
