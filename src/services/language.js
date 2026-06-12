import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import i18n from '../i18n';

const APP_LANG_KEY = 'app_language';
const CHAT_LANG_KEY = 'chat_language';

export const RTL_LANGS = ['ar', 'fa'];
export const isRTLLang = (lang) => RTL_LANGS.includes(lang);

function applyRTL(lang) {
  if (Platform.OS !== 'web') {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRTLLang(lang));
  }
}

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', whisper: 'en' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', whisper: 'ar' },
  { code: 'es', label: 'Español', flag: '🇪🇸', whisper: 'es' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', whisper: 'fr' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', whisper: 'tr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', whisper: 'de' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', whisper: 'pt' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', whisper: 'it' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', whisper: 'ru' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', whisper: 'hi' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', whisper: 'id' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', whisper: 'ko' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', whisper: 'ja' },
  { code: 'zh', label: '中文', flag: '🇨🇳', whisper: 'zh' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', whisper: 'nl' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', whisper: 'pl' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭', whisper: 'th' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', whisper: 'vi' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾', whisper: 'ms' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', whisper: 'uk' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', whisper: 'fa' },
];

export async function getAppLanguage() {
  return (await AsyncStorage.getItem(APP_LANG_KEY)) || 'en';
}

export async function setAppLanguage(code) {
  await AsyncStorage.setItem(APP_LANG_KEY, code);
  i18n.changeLanguage(code);
  applyRTL(code);
}

export async function getChatLanguage() {
  return (await AsyncStorage.getItem(CHAT_LANG_KEY)) || 'auto';
}

export async function setChatLanguage(code) {
  await AsyncStorage.setItem(CHAT_LANG_KEY, code);
}

export async function initLanguage() {
  const lang = await getAppLanguage();
  i18n.changeLanguage(lang);
  applyRTL(lang);
}
