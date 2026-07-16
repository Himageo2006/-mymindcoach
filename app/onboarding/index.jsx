import { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, FlatList,
  Animated, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveUserProfile } from '../../src/services/storage';
import { setAppLanguage } from '../../src/services/language';
import { setSelectedCoach } from '../../src/services/coachService';
import { getCoachesForLanguage, getNativeCoaches } from '../../src/data/coaches';
import { COUNTRIES, LANGUAGE_META, getSupportedLanguages } from '../../src/data/countries';
import { useColors } from '../../src/context/ThemeContext';
import { tapLight, tapMedium } from '../../src/services/haptics';
import { useOnboardingI18n } from '../../src/i18n/onboardingI18n';
import i18n from '../../src/i18n';
import * as Localization from 'expo-localization';

const { width } = Dimensions.get('window');

// ─── Step constants ────────────────────────────────────────────────────────
const STEP_WELCOME  = 0;
const STEP_NAME     = 1;
const STEP_AGE      = 2;
const STEP_GENDER   = 3;
const STEP_COUNTRY  = 4;
const STEP_LANGUAGE = 5;
const STEP_DOCTOR   = 6;
const STEP_GOAL     = 7;
const TOTAL_DOTS    = 7; // steps 1-7


// ─── Sub-components ────────────────────────────────────────────────────────

function ProgressDots({ step, s }) {
  if (step === STEP_WELCOME) return null;
  const active = step - 1;
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotActive, i < active && s.dotDone]} />
      ))}
    </View>
  );
}

function BackButton({ onPress, s }) {
  return (
    <TouchableOpacity style={s.back} onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={s.backText}>←</Text>
    </TouchableOpacity>
  );
}

// ─── Country item ──────────────────────────────────────────────────────────
function CountryItem({ item, onPress, s }) {
  return (
    <TouchableOpacity style={s.countryRow} onPress={() => onPress(item)} activeOpacity={0.7}>
      <Text style={s.countryFlag}>{item.flag}</Text>
      <Text style={s.countryName}>{item.name}</Text>
      <Text style={s.countryArrow}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Coach card ────────────────────────────────────────────────────────────
function CoachCard({ coach, selected, onPress, s, Colors }) {
  return (
    <TouchableOpacity
      style={[s.coachCard, selected && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]}
      onPress={() => onPress(coach)}
      activeOpacity={0.8}
    >
      <View style={[s.coachAvatarCircle, { backgroundColor: coach.color + '20' }]}>
        <Text style={s.coachAvatarEmoji}>{coach.avatar}</Text>
      </View>
      <View style={s.coachInfo}>
        <View style={s.coachNameRow}>
          <Text style={s.coachName}>{coach.name}</Text>
          {coach.dialectLabel && (
            <View style={s.dialectBadge}>
              <Text style={s.dialectText}>{coach.dialectLabel}</Text>
            </View>
          )}
        </View>
        <Text style={s.coachSpecialty}>{coach.specialty}</Text>
        <Text style={s.coachAbout} numberOfLines={2}>{coach.about}</Text>
      </View>
      {selected && (
        <View style={[s.checkCircle, { backgroundColor: Colors.primary }]}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Onboarding() {
  const Colors = useColors();
  const s = useMemo(() => createStyles(Colors), [Colors]);
  const [step, setStep]               = useState(STEP_WELCOME);
  const [name, setName]               = useState('');
  const [age, setAge]                 = useState('');
  const [country, setCountry]         = useState(null);
  const [countrySearch, setSearch]    = useState('');
  const [langOptions, setLangOptions] = useState([]);
  const [selectedLang, setSelLang]    = useState('en');
  const [coaches, setCoaches]         = useState([]);
  const [genderFilter, setGender]     = useState('all');
  const [selectedCoachObj, setSelCoach] = useState(null);
  const [userGender, setUserGender]   = useState('');
  const [goal, setGoal]               = useState('');
  const [loading, setLoading]         = useState(false);

  // Detect device locale on first mount and pre-select language
  useEffect(() => {
    const locales = Localization.getLocales();
    const deviceLang = locales?.[0]?.languageCode || 'en';
    const supported = ['ar', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'hi', 'id', 'ko', 'ja', 'zh', 'nl', 'pl', 'th', 'vi', 'ms', 'uk', 'fa', 'tr'];
    if (supported.includes(deviceLang)) {
      setSelLang(deviceLang);
      i18n.changeLanguage(deviceLang);
    }
  }, []);

  const o = useOnboardingI18n(selectedLang);

  const GOALS = useMemo(() => [
    { id: 'stress',  label: o.goalStressLabel,  desc: o.goalStressDesc },
    { id: 'anxiety', label: o.goalAnxietyLabel, desc: o.goalAnxietyDesc },
    { id: 'mood',    label: o.goalMoodLabel,    desc: o.goalMoodDesc },
    { id: 'lonely',  label: o.goalLonelyLabel,  desc: o.goalLonelyDesc },
    { id: 'general', label: o.goalGeneralLabel, desc: o.goalGeneralDesc },
  ], [selectedLang]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function animateTransition(fn) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function goTo(nextStep) {
    tapLight();
    animateTransition(() => setStep(nextStep));
  }

  function goBack() {
    tapLight();
    if (step === STEP_LANGUAGE) { animateTransition(() => setStep(STEP_COUNTRY)); return; }
    if (step === STEP_DOCTOR && langOptions.length <= 1) { animateTransition(() => setStep(STEP_COUNTRY)); return; }
    animateTransition(() => setStep(s => s - 1));
  }

  // After country picked → detect language(s) and route appropriately
  function handleCountryPick(c) {
    tapMedium();
    setCountry(c);
    setSearch('');
    const supported = getSupportedLanguages(c);

    let langs;
    if (supported.length === 1 && supported[0] === 'en') {
      // English-only country — no choice needed
      langs = ['en'];
    } else if (supported.includes('en')) {
      // Already includes English (e.g. Canada, India, Malaysia)
      langs = supported;
    } else {
      // Non-English country — always add English as an alternative
      langs = [...supported, 'en'];
    }

    setLangOptions(langs);

    if (langs.length === 1) {
      const lang = langs[0];
      setSelLang(lang);
      i18n.changeLanguage(lang);
      const coachList = getCoachesForLanguage(lang);
      setCoaches(coachList);
      setSelCoach(coachList[0]);
      animateTransition(() => setStep(STEP_DOCTOR));
    } else {
      setSelLang(langs[0]);
      i18n.changeLanguage(langs[0]);
      animateTransition(() => setStep(STEP_LANGUAGE));
    }
  }

  function handleLanguagePick(lang) {
    tapMedium();
    setSelLang(lang);
    i18n.changeLanguage(lang);
    const coachList = getCoachesForLanguage(lang);
    setCoaches(coachList);
    setSelCoach(coachList[0]);
    animateTransition(() => setStep(STEP_DOCTOR));
  }

  async function handleFinish() {
    if (!goal || loading) return;
    tapMedium();
    setLoading(true);
    try {
      await setAppLanguage(selectedLang);
      if (selectedCoachObj) await setSelectedCoach(selectedCoachObj);
      await saveUserProfile(name.trim(), goal, age.trim() || null, country?.name || null, userGender || null);
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
  }, [countrySearch]);

  // Filtered coaches by gender
  const filteredCoaches = useMemo(() => {
    if (genderFilter === 'all') return coaches;
    return coaches.filter(c => c.gender === genderFilter);
  }, [coaches, genderFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {step > STEP_WELCOME && (
        <BackButton onPress={goBack} s={s} />
      )}
      <ProgressDots step={step} s={s} />

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* ── STEP 0: Welcome ─────────────────────────────────────────── */}
          {step === STEP_WELCOME && (
            <View style={s.slide}>
              <Text style={s.bigEmoji}>🧠</Text>
              <Text style={s.title}>{o.welcomeTitle}</Text>
              <Text style={s.subtitle}>{o.welcomeSubtitle}</Text>

              {/* Feature highlights */}
              <View style={s.featureList}>
                {[
                  { icon: '💬', text: o.welcomeFeat1 },
                  { icon: '📝', text: o.welcomeFeat2 },
                  { icon: '📊', text: o.welcomeFeat3 },
                ].map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <Text style={s.featureIcon}>{f.icon}</Text>
                    <Text style={s.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.btn} onPress={() => goTo(STEP_NAME)}>
                <Text style={s.btnText}>{o.getStarted}</Text>
              </TouchableOpacity>

              {/* AI disclosure + privacy consent */}
              <Text style={s.privacyNote}>
                {'By continuing, you agree that your messages will be processed by third-party AI providers (Google, Groq, Cloudflare, and OpenRouter) to generate responses. '}
                <Text style={s.privacyLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
              </Text>
            </View>
          )}

          {/* ── STEP 1: Name ─────────────────────────────────────────────── */}
          {step === STEP_NAME && (
            <View style={s.slide}>
              <Text style={s.bigEmoji}>👋</Text>
              <Text style={s.title}>{o.nameTitle}</Text>
              <TextInput
                style={s.input}
                placeholder={o.namePlaceholder}
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim() && goTo(STEP_AGE)}
              />
              <TouchableOpacity
                style={[s.btn, !name.trim() && s.btnOff]}
                onPress={() => name.trim() && goTo(STEP_AGE)}
              >
                <Text style={s.btnText}>{o.continueBtn}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Age ───────────────────────────────────────────────── */}
          {step === STEP_AGE && (
            <View style={s.slide}>
              <Text style={s.bigEmoji}>🎂</Text>
              <Text style={s.title}>{o.ageTitle.replace('{{name}}', name)}</Text>
              <Text style={s.subtitle}>{o.ageSubtitle}</Text>
              <TextInput
                style={s.input}
                placeholder={o.agePlaceholder}
                placeholderTextColor={Colors.textMuted}
                value={age}
                onChangeText={t => { if (/^\d{0,3}$/.test(t)) setAge(t); }}
                keyboardType="number-pad"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => goTo(STEP_GENDER)}
              />
              <TouchableOpacity style={s.btn} onPress={() => goTo(STEP_GENDER)}>
                <Text style={s.btnText}>{o.continueBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.skipBtn} onPress={() => goTo(STEP_GENDER)}>
                <Text style={s.skipText}>{o.skipBtn}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Gender ───────────────────────────────────────────── */}
          {step === STEP_GENDER && (
            <View style={s.slide}>
              <Text style={s.bigEmoji}>🧬</Text>
              <Text style={s.title}>{o.genderTitle}</Text>
              <Text style={s.subtitle}>{o.genderSubtitle}</Text>
              <View style={{ width: '100%', gap: 12 }}>
                {[
                  { id: 'male',   emoji: '👨', label: o.genderMale },
                  { id: 'female', emoji: '👩', label: o.genderFemale },
                  { id: 'other',  emoji: '',   label: o.genderOther },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[s.genderCard, userGender === opt.id && s.genderCardActive]}
                    onPress={() => { tapLight(); setUserGender(opt.id); }}
                    activeOpacity={0.8}
                  >
                    {opt.emoji ? <Text style={s.genderEmoji}>{opt.emoji}</Text> : null}
                    <Text style={[s.genderLabel, userGender === opt.id && s.genderLabelActive]}>{opt.label}</Text>
                    {userGender === opt.id && <Text style={{ marginLeft: 'auto', fontSize: 18 }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[s.btn, !userGender && s.btnOff, { marginTop: 20 }]}
                onPress={() => userGender && goTo(STEP_COUNTRY)}
              >
                <Text style={s.btnText}>{o.continueBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.skipBtn} onPress={() => goTo(STEP_COUNTRY)}>
                <Text style={s.skipText}>{o.skipBtn}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 4: Country ───────────────────────────────────────────── */}
          {step === STEP_COUNTRY && (
            <View style={{ flex: 1 }}>
              <View style={s.countryHeader}>
                <Text style={s.title}>{o.countryTitle}</Text>
                <Text style={s.subtitle}>{o.countrySubtitle}</Text>
                <TextInput
                  style={s.searchInput}
                  placeholder={o.countrySearch}
                  placeholderTextColor={Colors.textMuted}
                  value={countrySearch}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>
              <FlatList
                data={filteredCountries}
                keyExtractor={item => item.name + item.flag}
                renderItem={({ item }) => <CountryItem item={item} onPress={handleCountryPick} s={s} />}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
                ItemSeparatorComponent={() => <View style={s.sep} />}
              />
            </View>
          )}

          {/* ── STEP 5: Language choice ───────────────────────────────────── */}
          {step === STEP_LANGUAGE && (() => {
            const isTwoOption = langOptions.length === 2;
            return (
              <View style={s.slide}>
                <Text style={s.bigEmoji}>{country?.flag}</Text>
                <Text style={s.title}>{o.chooseLang || 'Choose your language'}</Text>
                <Text style={s.subtitle}>
                  {o.langSubtitle || 'Select the language you\'d like to chat with your coach in'}
                </Text>
                <View style={{ width: '100%', gap: 14, marginTop: 8 }}>
                  {langOptions.map(lang => {
                    const meta = LANGUAGE_META[lang];
                    const nativeLang = langOptions.find(l => l !== 'en');
                    const count = (lang === 'en' && nativeLang)
                      ? getCoachesForLanguage(nativeLang).filter(c => !c.isNative).length
                      : getNativeCoaches(lang).length;
                    if (isTwoOption) {
                      return (
                        <TouchableOpacity
                          key={lang}
                          style={s.langCardBig}
                          onPress={() => handleLanguagePick(lang)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 40 }}>{meta.flag}</Text>
                          <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text }}>
                              {meta.nativeName}
                            </Text>
                            <Text style={{ fontSize: 14, color: Colors.textLight, marginTop: 2 }}>
                              {meta.label}
                            </Text>
                          </View>
                          <View style={s.langBadge}>
                            <Text style={s.langBadgeText}>{o.coachesCount ? o.coachesCount.replace('{{n}}', count) : `${count} coaches`}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }
                    // 3+ options: grid layout
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={s.langCard}
                        onPress={() => handleLanguagePick(lang)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.langFlag}>{meta.flag}</Text>
                        <Text style={s.langLabel}>{meta.label}</Text>
                        <Text style={s.langNative}>{meta.nativeName}</Text>
                        <View style={s.langBadge}>
                          <Text style={s.langBadgeText}>{o.coachesCount.replace('{{n}}', count)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* ── STEP 5: Doctor selection ──────────────────────────────────── */}
          {step === STEP_DOCTOR && (
            <View style={{ flex: 1 }}>
              <View style={s.doctorHeader}>
                <Text style={s.title}>{o.chooseCoach}</Text>
                <Text style={s.subtitle}>
                  {o.coachesReady
                    .replace('{{n}}', coaches.length)
                    .replace('{{language}}', LANGUAGE_META[selectedLang]?.label || '')}
                </Text>
                {/* Gender filter */}
                <View style={s.filterRow}>
                  {[['all', o.filterAll], ['female', o.filterFemale], ['male', o.filterMale]].map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[s.filterTab, genderFilter === val && s.filterTabActive]}
                      onPress={() => { tapLight(); setGender(val); }}
                    >
                      <Text style={[s.filterText, genderFilter === val && s.filterTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <FlatList
                data={filteredCoaches}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <CoachCard
                    coach={item}
                    selected={selectedCoachObj?.id === item.id}
                    onPress={c => { tapLight(); setSelCoach(c); }}
                    s={s}
                    Colors={Colors}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
              {/* Sticky continue button */}
              <View style={s.stickyBar}>
                <TouchableOpacity
                  style={[s.btn, !selectedCoachObj && s.btnOff]}
                  onPress={() => selectedCoachObj && goTo(STEP_GOAL)}
                >
                  <Text style={s.btnText}>
                    {o.continueWith.replace('{{name}}', selectedCoachObj?.name?.split(' ').slice(-1)[0] || '')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 6: Goal ──────────────────────────────────────────────── */}
          {step === STEP_GOAL && (
            <View style={s.slide}>
              <Text style={s.bigEmoji}>🎯</Text>
              <Text style={s.title}>{o.whatBrings.replace('{{name}}', name)}</Text>
              <Text style={s.subtitle}>{o.helpsBetter}</Text>
              <View style={{ width: '100%' }}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[s.goalCard, goal === g.id && s.goalCardActive]}
                    onPress={() => { tapLight(); setGoal(g.id); }}
                  >
                    <Text style={s.goalLabel}>{g.label}</Text>
                    <Text style={s.goalDesc}>{g.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[s.btn, (!goal || loading) && s.btnOff, { marginTop: 16 }]}
                onPress={handleFinish}
                disabled={!goal || loading}
              >
                <Text style={s.btnText}>{loading ? o.settingUp : o.letsBegin}</Text>
              </TouchableOpacity>
            </View>
          )}

        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
function createStyles(C) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    slide: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 24, paddingBottom: 32,
    },
    bigEmoji: { fontSize: 72, marginBottom: 20 },
    title: {
      fontSize: 28, fontWeight: '800', color: C.text,
      textAlign: 'center', marginBottom: 12, lineHeight: 36,
    },
    subtitle: {
      fontSize: 15, color: C.textLight, textAlign: 'center',
      marginBottom: 20, lineHeight: 22,
    },

    // Welcome feature list
    featureList: {
      width: '100%', marginBottom: 24,
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border, padding: 16, gap: 12,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { fontSize: 22, width: 32, textAlign: 'center' },
    featureText: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500', lineHeight: 20 },
    privacyNote: {
      fontSize: 12, color: C.textMuted, textAlign: 'center',
      marginTop: 16, lineHeight: 18,
    },
    privacyLink: {
      color: C.primary, textDecorationLine: 'underline', fontWeight: '600',
    },

    // Input
    input: {
      width: '100%', backgroundColor: C.card, borderWidth: 1.5,
      borderColor: C.border, borderRadius: 14, padding: 16,
      fontSize: 18, color: C.text, marginBottom: 16,
    },
    searchInput: {
      backgroundColor: C.card, borderWidth: 1.5,
      borderColor: C.border, borderRadius: 12, padding: 12,
      fontSize: 15, color: C.text, marginTop: 12,
    },

    // Buttons
    btn: {
      width: '100%', backgroundColor: C.primary,
      borderRadius: 14, padding: 16, alignItems: 'center',
    },
    btnOff: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    skipBtn: { marginTop: 12, padding: 8 },
    skipText: { color: C.textLight, fontSize: 14 },

    // Country
    countryHeader: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
    countryRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 14,
      backgroundColor: C.card,
    },
    countryFlag: { fontSize: 26, width: 40 },
    countryName: { flex: 1, fontSize: 16, color: C.text, fontWeight: '500' },
    countryArrow: { fontSize: 20, color: C.textMuted },
    sep: { height: 1, backgroundColor: C.border, marginLeft: 68 },

    // Language choice
    langGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: 12, marginTop: 4,
    },
    langCard: {
      width: (width - 72) / 2, backgroundColor: C.card,
      borderWidth: 1.5, borderColor: C.border, borderRadius: 16,
      padding: 18, alignItems: 'center',
    },
    langFlag: { fontSize: 36, marginBottom: 8 },
    langLabel: { fontSize: 16, fontWeight: '700', color: C.text },
    langNative: { fontSize: 13, color: C.textLight, marginTop: 2 },
    langBadge: {
      marginTop: 10, backgroundColor: C.primaryLight,
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    langBadgeText: { fontSize: 12, color: C.primary, fontWeight: '600' },

    // Big language card (Arabic / English 2-option layout)
    langCardBig: {
      flexDirection: 'row', alignItems: 'center',
      width: '100%', backgroundColor: C.card,
      borderWidth: 2, borderColor: C.border, borderRadius: 20,
      padding: 20,
    },

    // Doctor
    doctorHeader: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
    filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    filterTab: {
      flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center',
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    },
    filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
    filterText: { fontSize: 13, color: C.textLight, fontWeight: '500' },
    filterTextActive: { color: '#fff', fontWeight: '700' },

    coachCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
      borderRadius: 16, padding: 14,
    },
    coachAvatarCircle: {
      width: 52, height: 52, borderRadius: 26,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    coachAvatarEmoji: { fontSize: 28 },
    coachInfo: { flex: 1 },
    coachNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    coachName: { fontSize: 15, fontWeight: '700', color: C.text },
    dialectBadge: {
      backgroundColor: C.primaryLight, borderRadius: 10,
      paddingHorizontal: 7, paddingVertical: 2,
    },
    dialectText: { fontSize: 11, color: C.primary, fontWeight: '600' },
    coachSpecialty: { fontSize: 12, color: C.primary, fontWeight: '600', marginTop: 2 },
    coachAbout: { fontSize: 12, color: C.textLight, marginTop: 4, lineHeight: 16 },
    checkCircle: {
      width: 26, height: 26, borderRadius: 13,
      justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },

    stickyBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.background, paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: C.border,
    },

    // Gender
    genderCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
      borderRadius: 14, padding: 16, gap: 12,
    },
    genderCardActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
    genderEmoji: { fontSize: 26 },
    genderLabel: { fontSize: 16, fontWeight: '600', color: C.text },
    genderLabelActive: { color: C.primary },

    // Goal
    goalCard: {
      width: '100%', backgroundColor: C.card,
      borderWidth: 1.5, borderColor: C.border,
      borderRadius: 14, padding: 14, marginBottom: 10,
    },
    goalCardActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
    goalLabel: { fontSize: 15, fontWeight: '600', color: C.text },
    goalDesc: { fontSize: 13, color: C.textLight, marginTop: 2 },

    // Progress dots + back button
    dotsRow: {
      flexDirection: 'row', justifyContent: 'center',
      alignItems: 'center', paddingTop: 16, paddingBottom: 4, gap: 6,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
    dotActive: { backgroundColor: C.primary, width: 24 },
    dotDone: { backgroundColor: C.primary + '60' },
    back: {
      position: 'absolute', top: 16, left: 20, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      justifyContent: 'center', alignItems: 'center',
    },
    backText: { fontSize: 18, color: C.text, lineHeight: 22 },
  });
}
