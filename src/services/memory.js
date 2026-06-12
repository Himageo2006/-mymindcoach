import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_KEY = 'ai_memory';
const SERVER_URL = 'https://mindtalk-server-production.up.railway.app';
const APP_KEY = 'mk-app-2024-xK9pL3mNqR7vW2jT';

export async function getMemory() {
  const raw = await AsyncStorage.getItem(MEMORY_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveMemory(memory) {
  await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export async function clearMemory() {
  await AsyncStorage.removeItem(MEMORY_KEY);
}

export async function extractAndSaveMemory(messages) {
  if (messages.length < 4) return;

  try {
    const response = await fetch(`${SERVER_URL}/api/extract-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-key': APP_KEY },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    if (data.memory) {
      await saveMemory(data.memory);
    }
  } catch (e) {
    console.log('Memory extraction failed:', e.message);
  }
}
