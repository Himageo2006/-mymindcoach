import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKUP_RESULT_KEY = 'last_checkup_result';
const CHECKUP_DATE_KEY   = 'last_checkup_date';
const CHECKUP_TTL_MS     = 8 * 60 * 60 * 1000; // 8 hours — one checkup per working session

// Per-session in-memory cache so we don't hit AsyncStorage on every render
let _cachedNeedsCheckup = null;

export async function needsCheckup() {
  if (_cachedNeedsCheckup === false) return false; // already done this session

  const raw = await AsyncStorage.getItem(CHECKUP_DATE_KEY);
  if (!raw) return true;

  const elapsed = Date.now() - Number(raw);
  const needs = elapsed > CHECKUP_TTL_MS;
  if (!needs) _cachedNeedsCheckup = false; // cache the result
  return needs;
}

export function markCheckupDoneThisSession() {
  _cachedNeedsCheckup = false;
}

export async function saveCheckupResult(result) {
  _cachedNeedsCheckup = false;
  await AsyncStorage.setItem(CHECKUP_DATE_KEY, String(Date.now()));
  await AsyncStorage.setItem(CHECKUP_RESULT_KEY, JSON.stringify(result));
}

export async function getLastCheckupResult() {
  const raw = await AsyncStorage.getItem(CHECKUP_RESULT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function scoreCheckup(answers) {
  const moodScore   = answers.mood?.score   ?? 3;
  const sleepScore  = answers.sleep?.score  ?? 3;
  const stressScore = answers.stress?.score ?? 3;
  const avg = (moodScore + sleepScore + stressScore) / 3;
  if (avg >= 4) return { label: 'Good',     color: '#10B981', emoji: '🟢' };
  if (avg >= 3) return { label: 'Moderate', color: '#F59E0B', emoji: '🟡' };
  return           { label: 'Low',      color: '#EF4444', emoji: '🔴' };
}
