import AsyncStorage from '@react-native-async-storage/async-storage';

// ── AI data-use consent (Apple 5.1.1/5.1.2): user must agree before any AI call ──
export async function getAIConsent() {
  return (await AsyncStorage.getItem('ai_consent_v1')) === 'yes';
}
export async function setAIConsent() {
  await AsyncStorage.setItem('ai_consent_v1', 'yes');
}

export async function saveUserProfile(name, goal, age = null, nationality = null, userGender = null) {
  await AsyncStorage.setItem('user_name', name);
  await AsyncStorage.setItem('user_goal', goal);
  if (age) await AsyncStorage.setItem('user_age', age);
  if (nationality) await AsyncStorage.setItem('user_nationality', nationality);
  if (userGender) await AsyncStorage.setItem('user_gender', userGender);
  await AsyncStorage.setItem('onboarded', 'true');
}

export async function getUserProfile() {
  const name = await AsyncStorage.getItem('user_name');
  const goal = await AsyncStorage.getItem('user_goal');
  const age = await AsyncStorage.getItem('user_age');
  const nationality = await AsyncStorage.getItem('user_nationality');
  const gender = await AsyncStorage.getItem('user_gender');
  const onboarded = await AsyncStorage.getItem('onboarded');
  return {
    name: name || 'Friend',
    goal: goal || 'general',
    age: age || null,
    nationality: nationality || null,
    gender: gender || null,
    onboarded: onboarded === 'true',
  };
}

export async function saveMood(mood, note = '', sleep = null, energy = null) {
  const existing = await AsyncStorage.getItem('mood_history');
  const history = existing ? JSON.parse(existing) : [];
  history.unshift({ mood, note, sleep, energy, date: new Date().toISOString() });
  await AsyncStorage.setItem('mood_history', JSON.stringify(history.slice(0, 90)));
}

export async function getMoodHistory() {
  const data = await AsyncStorage.getItem('mood_history');
  return data ? JSON.parse(data) : [];
}

export async function saveJournalEntry(text) {
  const existing = await AsyncStorage.getItem('journal_entries');
  const entries = existing ? JSON.parse(existing) : [];
  entries.unshift({ text, date: new Date().toISOString(), id: Date.now().toString() });
  await AsyncStorage.setItem('journal_entries', JSON.stringify(entries));
}

export async function getJournalEntries() {
  const data = await AsyncStorage.getItem('journal_entries');
  return data ? JSON.parse(data) : [];
}

export async function saveApiKey(key) {
  await AsyncStorage.setItem('anthropic_api_key', key);
}

export async function getApiKey() {
  return await AsyncStorage.getItem('anthropic_api_key');
}

export async function updateStreak() {
  const data = await AsyncStorage.getItem('streak_data');
  const streak = data ? JSON.parse(data) : { count: 0, lastDate: null };
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (streak.lastDate === today) return streak.count;
  streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  streak.lastDate = today;
  await AsyncStorage.setItem('streak_data', JSON.stringify(streak));
  return streak.count;
}

export async function getStreak() {
  const data = await AsyncStorage.getItem('streak_data');
  return data ? JSON.parse(data).count : 0;
}

export async function resetOnboarding() {
  const keys = ['onboarded', 'user_name', 'user_goal', 'user_age', 'user_nationality', 'user_gender', 'selected_coach', 'app_language', 'chat_language'];
  await Promise.all(keys.map(k => AsyncStorage.removeItem(k)));
}
