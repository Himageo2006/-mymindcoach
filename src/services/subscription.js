import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function initRevenueCat() {
  // RevenueCat disabled until production — uncomment when connecting real store keys
  // if (Platform.OS === 'web') return;
  // try {
  //   const rc = await import('react-native-purchases');
  //   Purchases = rc.default;
  //   await Purchases.configure({ apiKey: 'test_lfCrAoJpNkemTMsbvfeXQjEpklp' });
  // } catch (e) {
  //   console.log('RevenueCat not available:', e.message);
  // }
}

// ─── Plan detection ───────────────────────────────────────────────────────────

/** Returns 'free' | 'pro_monthly' | 'pro_annual' */
export async function getActivePlan() {
  // Web / testing override
  if (Platform.OS === 'web') {
    const val = await AsyncStorage.getItem(PREMIUM_KEY);
    if (val === 'true') {
      const plan = await AsyncStorage.getItem(PLAN_KEY);
      return plan === 'pro_annual' ? 'pro_annual' : 'pro_monthly';
    }
    return 'free';
  }

  if (!Purchases) return 'free';
  try {
    const info = await Purchases.getCustomerInfo();
    const active = info.entitlements.active;
    if (!active || Object.keys(active).length === 0) return 'free';

    // Check which product is active to distinguish monthly vs annual
    const proEntitlement = active['pro'];
    if (proEntitlement) {
      const productId = proEntitlement.productIdentifier || '';
      if (productId.includes('annual') || productId.includes('yearly')) {
        return 'pro_annual';
      }
      return 'pro_monthly';
    }
    // Fallback: any active entitlement = pro_monthly
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
  return null; // RevenueCat disabled until production
}

export async function purchasePremium(pkg) {
  throw new Error('Purchases not available in this build');
}

export async function restorePurchases() {
  throw new Error('Restore not available in this build');
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
