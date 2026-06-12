// languages array = supported coach languages available for this country
// If multiple, user will be prompted to choose
export const COUNTRIES = [
  // ── English ───────────────────────────────────────────────────────────────
  { name: 'United States', flag: '🇺🇸', languages: ['en'] },
  { name: 'United Kingdom', flag: '🇬🇧', languages: ['en'] },
  { name: 'Australia', flag: '🇦🇺', languages: ['en'] },
  { name: 'New Zealand', flag: '🇳🇿', languages: ['en'] },
  { name: 'Ireland', flag: '🇮🇪', languages: ['en'] },
  { name: 'South Africa', flag: '🇿🇦', languages: ['en'] },
  { name: 'Singapore', flag: '🇸🇬', languages: ['en'] },
  { name: 'Philippines', flag: '🇵🇭', languages: ['en'] },
  { name: 'Nigeria', flag: '🇳🇬', languages: ['en'] },
  { name: 'Ghana', flag: '🇬🇭', languages: ['en'] },
  { name: 'Kenya', flag: '🇰🇪', languages: ['en'] },
  { name: 'Ethiopia', flag: '🇪🇹', languages: ['en'] },
  { name: 'Tanzania', flag: '🇹🇿', languages: ['en'] },
  { name: 'Zimbabwe', flag: '🇿🇼', languages: ['en'] },
  { name: 'Zambia', flag: '🇿🇲', languages: ['en'] },
  { name: 'Malaysia', flag: '🇲🇾', languages: ['ms', 'en'] },
  { name: 'Pakistan', flag: '🇵🇰', languages: ['en'] },
  { name: 'Bangladesh', flag: '🇧🇩', languages: ['en'] },
  { name: 'Sri Lanka', flag: '🇱🇰', languages: ['en'] },
  { name: 'Jamaica', flag: '🇯🇲', languages: ['en'] },
  { name: 'Trinidad & Tobago', flag: '🇹🇹', languages: ['en'] },
  { name: 'Barbados', flag: '🇧🇧', languages: ['en'] },
  { name: 'Malta', flag: '🇲🇹', languages: ['en'] },

  // ── Canada & India — bilingual ─────────────────────────────────────────────
  { name: 'Canada', flag: '🇨🇦', languages: ['en', 'fr'] },
  { name: 'India', flag: '🇮🇳', languages: ['hi', 'en'] },

  // ── Arabic only ───────────────────────────────────────────────────────────
  { name: 'Saudi Arabia', flag: '🇸🇦', languages: ['ar'] },
  { name: 'Egypt', flag: '🇪🇬', languages: ['ar'] },
  { name: 'UAE', flag: '🇦🇪', languages: ['ar'] },
  { name: 'Jordan', flag: '🇯🇴', languages: ['ar'] },
  { name: 'Kuwait', flag: '🇰🇼', languages: ['ar'] },
  { name: 'Qatar', flag: '🇶🇦', languages: ['ar'] },
  { name: 'Bahrain', flag: '🇧🇭', languages: ['ar'] },
  { name: 'Oman', flag: '🇴🇲', languages: ['ar'] },
  { name: 'Yemen', flag: '🇾🇪', languages: ['ar'] },
  { name: 'Iraq', flag: '🇮🇶', languages: ['ar'] },
  { name: 'Syria', flag: '🇸🇾', languages: ['ar'] },
  { name: 'Libya', flag: '🇱🇾', languages: ['ar'] },
  { name: 'Sudan', flag: '🇸🇩', languages: ['ar'] },
  { name: 'Palestine', flag: '🇵🇸', languages: ['ar'] },
  { name: 'Somalia', flag: '🇸🇴', languages: ['ar'] },

  // ── Arabic + French ───────────────────────────────────────────────────────
  { name: 'Morocco', flag: '🇲🇦', languages: ['ar', 'fr'] },
  { name: 'Algeria', flag: '🇩🇿', languages: ['ar', 'fr'] },
  { name: 'Tunisia', flag: '🇹🇳', languages: ['ar', 'fr'] },
  { name: 'Lebanon', flag: '🇱🇧', languages: ['ar', 'fr'] },
  { name: 'Mauritania', flag: '🇲🇷', languages: ['ar', 'fr'] },
  { name: 'Djibouti', flag: '🇩🇯', languages: ['ar', 'fr'] },
  { name: 'Comoros', flag: '🇰🇲', languages: ['ar', 'fr'] },

  // ── French ────────────────────────────────────────────────────────────────
  { name: 'France', flag: '🇫🇷', languages: ['fr'] },
  { name: 'Belgium', flag: '🇧🇪', languages: ['fr'] },
  { name: 'Haiti', flag: '🇭🇹', languages: ['fr'] },
  { name: 'Ivory Coast', flag: '🇨🇮', languages: ['fr'] },
  { name: 'Senegal', flag: '🇸🇳', languages: ['fr'] },
  { name: 'Cameroon', flag: '🇨🇲', languages: ['fr'] },
  { name: 'Mali', flag: '🇲🇱', languages: ['fr'] },
  { name: 'Burkina Faso', flag: '🇧🇫', languages: ['fr'] },
  { name: 'Niger', flag: '🇳🇪', languages: ['fr'] },
  { name: 'Chad', flag: '🇹🇩', languages: ['fr'] },
  { name: 'Madagascar', flag: '🇲🇬', languages: ['fr'] },
  { name: 'Rwanda', flag: '🇷🇼', languages: ['fr'] },
  { name: 'Guinea', flag: '🇬🇳', languages: ['fr'] },
  { name: 'Benin', flag: '🇧🇯', languages: ['fr'] },
  { name: 'Togo', flag: '🇹🇬', languages: ['fr'] },
  { name: 'Gabon', flag: '🇬🇦', languages: ['fr'] },
  { name: 'Congo', flag: '🇨🇬', languages: ['fr'] },
  { name: 'DR Congo', flag: '🇨🇩', languages: ['fr'] },
  { name: 'Mauritius', flag: '🇲🇺', languages: ['fr'] },
  { name: 'Reunion', flag: '🇷🇪', languages: ['fr'] },
  { name: 'French Polynesia', flag: '🇵🇫', languages: ['fr'] },

  // ── Swiss: tri-lingual ────────────────────────────────────────────────────
  { name: 'Switzerland', flag: '🇨🇭', languages: ['de', 'fr', 'it'] },

  // ── Spanish ───────────────────────────────────────────────────────────────
  { name: 'Spain', flag: '🇪🇸', languages: ['es'] },
  { name: 'Mexico', flag: '🇲🇽', languages: ['es'] },
  { name: 'Colombia', flag: '🇨🇴', languages: ['es'] },
  { name: 'Argentina', flag: '🇦🇷', languages: ['es'] },
  { name: 'Chile', flag: '🇨🇱', languages: ['es'] },
  { name: 'Peru', flag: '🇵🇪', languages: ['es'] },
  { name: 'Venezuela', flag: '🇻🇪', languages: ['es'] },
  { name: 'Ecuador', flag: '🇪🇨', languages: ['es'] },
  { name: 'Bolivia', flag: '🇧🇴', languages: ['es'] },
  { name: 'Paraguay', flag: '🇵🇾', languages: ['es'] },
  { name: 'Uruguay', flag: '🇺🇾', languages: ['es'] },
  { name: 'Guatemala', flag: '🇬🇹', languages: ['es'] },
  { name: 'Cuba', flag: '🇨🇺', languages: ['es'] },
  { name: 'Dominican Republic', flag: '🇩🇴', languages: ['es'] },
  { name: 'Honduras', flag: '🇭🇳', languages: ['es'] },
  { name: 'El Salvador', flag: '🇸🇻', languages: ['es'] },
  { name: 'Nicaragua', flag: '🇳🇮', languages: ['es'] },
  { name: 'Costa Rica', flag: '🇨🇷', languages: ['es'] },
  { name: 'Panama', flag: '🇵🇦', languages: ['es'] },
  { name: 'Puerto Rico', flag: '🇵🇷', languages: ['es'] },

  // ── German ────────────────────────────────────────────────────────────────
  { name: 'Germany', flag: '🇩🇪', languages: ['de'] },
  { name: 'Austria', flag: '🇦🇹', languages: ['de'] },
  { name: 'Liechtenstein', flag: '🇱🇮', languages: ['de'] },
  { name: 'Luxembourg', flag: '🇱🇺', languages: ['de', 'fr'] },

  // ── Portuguese ────────────────────────────────────────────────────────────
  { name: 'Brazil', flag: '🇧🇷', languages: ['pt'] },
  { name: 'Portugal', flag: '🇵🇹', languages: ['pt'] },
  { name: 'Angola', flag: '🇦🇴', languages: ['pt'] },
  { name: 'Mozambique', flag: '🇲🇿', languages: ['pt'] },
  { name: 'Cape Verde', flag: '🇨🇻', languages: ['pt'] },
  { name: 'Guinea-Bissau', flag: '🇬🇼', languages: ['pt'] },

  // ── Italian ───────────────────────────────────────────────────────────────
  { name: 'Italy', flag: '🇮🇹', languages: ['it'] },
  { name: 'San Marino', flag: '🇸🇲', languages: ['it'] },
  { name: 'Vatican City', flag: '🇻🇦', languages: ['it'] },

  // ── Turkish ───────────────────────────────────────────────────────────────
  { name: 'Turkey', flag: '🇹🇷', languages: ['tr'] },
  { name: 'North Cyprus', flag: '🇹🇷', languages: ['tr'] },

  // ── Russian ───────────────────────────────────────────────────────────────
  { name: 'Russia', flag: '🇷🇺', languages: ['ru'] },
  { name: 'Belarus', flag: '🇧🇾', languages: ['ru'] },
  { name: 'Kazakhstan', flag: '🇰🇿', languages: ['ru'] },
  { name: 'Kyrgyzstan', flag: '🇰🇬', languages: ['ru'] },
  { name: 'Ukraine', flag: '🇺🇦', languages: ['uk', 'ru'] },
  { name: 'Moldova', flag: '🇲🇩', languages: ['ru'] },
  { name: 'Armenia', flag: '🇦🇲', languages: ['ru'] },
  { name: 'Georgia', flag: '🇬🇪', languages: ['ru'] },
  { name: 'Azerbaijan', flag: '🇦🇿', languages: ['ru'] },
  { name: 'Tajikistan', flag: '🇹🇯', languages: ['ru'] },
  { name: 'Uzbekistan', flag: '🇺🇿', languages: ['ru'] },
  { name: 'Turkmenistan', flag: '🇹🇲', languages: ['ru'] },

  // ── Indonesian ────────────────────────────────────────────────────────────
  { name: 'Indonesia', flag: '🇮🇩', languages: ['id'] },

  // ── Korean ────────────────────────────────────────────────────────────────
  { name: 'South Korea', flag: '🇰🇷', languages: ['ko'] },

  // ── Japanese ──────────────────────────────────────────────────────────────
  { name: 'Japan', flag: '🇯🇵', languages: ['ja'] },

  // ── Other / default English ───────────────────────────────────────────────
  { name: 'China', flag: '🇨🇳', languages: ['zh'] },
  { name: 'Thailand', flag: '🇹🇭', languages: ['th'] },
  { name: 'Vietnam', flag: '🇻🇳', languages: ['vi'] },
  { name: 'Myanmar', flag: '🇲🇲', languages: ['en'] },
  { name: 'Cambodia', flag: '🇰🇭', languages: ['en'] },
  { name: 'Laos', flag: '🇱🇦', languages: ['en'] },
  { name: 'Mongolia', flag: '🇲🇳', languages: ['ru', 'en'] },
  { name: 'Nepal', flag: '🇳🇵', languages: ['en'] },
  { name: 'Bhutan', flag: '🇧🇹', languages: ['en'] },
  { name: 'Maldives', flag: '🇲🇻', languages: ['en'] },
  { name: 'Afghanistan', flag: '🇦🇫', languages: ['ar', 'en'] },
  { name: 'Iran', flag: '🇮🇷', languages: ['fa'] },
  { name: 'Israel', flag: '🇮🇱', languages: ['ar', 'en'] },
  { name: 'Cyprus', flag: '🇨🇾', languages: ['en'] },
  { name: 'Greece', flag: '🇬🇷', languages: ['en'] },
  { name: 'Poland', flag: '🇵🇱', languages: ['pl'] },
  { name: 'Czech Republic', flag: '🇨🇿', languages: ['en'] },
  { name: 'Hungary', flag: '🇭🇺', languages: ['en'] },
  { name: 'Romania', flag: '🇷🇴', languages: ['en'] },
  { name: 'Bulgaria', flag: '🇧🇬', languages: ['ru', 'en'] },
  { name: 'Serbia', flag: '🇷🇸', languages: ['en'] },
  { name: 'Croatia', flag: '🇭🇷', languages: ['en'] },
  { name: 'Slovakia', flag: '🇸🇰', languages: ['en'] },
  { name: 'Slovenia', flag: '🇸🇮', languages: ['en'] },
  { name: 'Estonia', flag: '🇪🇪', languages: ['ru', 'en'] },
  { name: 'Latvia', flag: '🇱🇻', languages: ['ru', 'en'] },
  { name: 'Lithuania', flag: '🇱🇹', languages: ['ru', 'en'] },
  { name: 'Finland', flag: '🇫🇮', languages: ['en'] },
  { name: 'Sweden', flag: '🇸🇪', languages: ['en'] },
  { name: 'Norway', flag: '🇳🇴', languages: ['en'] },
  { name: 'Denmark', flag: '🇩🇰', languages: ['en'] },
  { name: 'Netherlands', flag: '🇳🇱', languages: ['nl'] },
  { name: 'Iceland', flag: '🇮🇸', languages: ['en'] },
];

export const LANGUAGE_META = {
  en: { label: 'English', flag: '🇺🇸', nativeName: 'English' },
  ar: { label: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  es: { label: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  fr: { label: 'French', flag: '🇫🇷', nativeName: 'Français' },
  tr: { label: 'Turkish', flag: '🇹🇷', nativeName: 'Türkçe' },
  de: { label: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  pt: { label: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
  it: { label: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  ru: { label: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  hi: { label: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  id: { label: 'Indonesian', flag: '🇮🇩', nativeName: 'Indonesia' },
  ko: { label: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
  ja: { label: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  zh: { label: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  nl: { label: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  pl: { label: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  th: { label: 'Thai', flag: '🇹🇭', nativeName: 'ภาษาไทย' },
  vi: { label: 'Vietnamese', flag: '🇻🇳', nativeName: 'Tiếng Việt' },
  ms: { label: 'Malay', flag: '🇲🇾', nativeName: 'Bahasa Melayu' },
  uk: { label: 'Ukrainian', flag: '🇺🇦', nativeName: 'Українська' },
  fa: { label: 'Persian', flag: '🇮🇷', nativeName: 'فارسی' },
};

const SUPPORTED = new Set(Object.keys(LANGUAGE_META));

// Returns only the languages from a country that we actually have coaches for
export function getSupportedLanguages(country) {
  return country.languages.filter(l => SUPPORTED.has(l));
}
