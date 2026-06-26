import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Share, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/context/ThemeContext';
import { getUserProfile, saveMood, getMoodHistory, updateStreak, getStreak } from '../../src/services/storage';
import { tapMedium, tapLight, success } from '../../src/services/haptics';
import { useHomeI18n } from '../../src/i18n/homeI18n';

const MOOD_IDS = ['great', 'good', 'okay', 'bad', 'awful'];
const MOOD_EMOJIS = { great: '😄', good: '🙂', okay: '😐', bad: '😔', awful: '😢' };

export default function Home() {
  const Colors = useColors();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const t = useHomeI18n(lang);
  const isRTL = ['ar', 'fa'].includes(lang);
  const styles = createStyles(Colors, isRTL);

  // Build mood list with translated labels
  const MOODS = MOOD_IDS.map(id => ({
    id,
    emoji: MOOD_EMOJIS[id],
    label: t[`mood${id.charAt(0).toUpperCase() + id.slice(1)}`],
  }));

  // Greeting based on time of day
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return t.morningGreet;
    if (h < 17) return t.afternoonGreet;
    return t.eveningGreet;
  }

  const [profile, setProfile] = useState({ name: 'Friend' });
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const [streak, setStreak] = useState(0);
  const [recentMoods, setRecentMoods] = useState([]);
  const [showTrackers, setShowTrackers] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [pendingMood, setPendingMood] = useState(null);


  const dateLocale = t.locale;

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
      getStreak().then(setStreak);
      getMoodHistory().then((h) => setRecentMoods(h.slice(0, 3)));
      maybePromptNotifications();
    }, [])
  );

  // One-time soft prompt to turn on daily reminders — only once the user has engaged.
  async function maybePromptNotifications() {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      if (await AsyncStorage.getItem('notif_prompt_shown')) return;
      const { isNotificationsEnabled, scheduleDaily } = await import('../../src/services/notifications');
      if (await isNotificationsEnabled()) return;
      const [st, hist] = await Promise.all([getStreak(), getMoodHistory()]);
      if (st < 1 && (!hist || hist.length < 1)) return;   // wait until they've engaged once
      await AsyncStorage.setItem('notif_prompt_shown', '1');
      const { getAppLanguage } = await import('../../src/services/language');
      const lang = (await getAppLanguage()) || 'en';
      const ar = lang === 'ar';
      Alert.alert(
        ar ? 'تذكير يومي 🔔' : 'Daily check-in 🔔',
        ar ? 'تحب نفكّرك كل يوم تطمن على مزاجك؟' : 'Want a gentle daily reminder to check in on your mood?',
        [
          { text: ar ? 'مش دلوقتي' : 'Not now', style: 'cancel' },
          { text: ar ? 'تفعيل' : 'Turn on', onPress: () => scheduleDaily(9, 0, lang) },
        ],
      );
    } catch { /* never block home on this */ }
  }

  const quote = t.quotes[new Date().getDay() % t.quotes.length];

  async function handleShareQuote() {
    tapLight();
    try {
      await Share.share({
        message: `"${quote}"\n\n— Daily wellness reminder from MyMindCoach 🧠\nTake care of your mental health every day.`,
      });
    } catch (e) {}
  }

  function handleMoodSelect(mood) {
    tapMedium();
    setSelectedMood(mood);
    setPendingMood(mood);
    setShowTrackers(true);
  }

  async function handleSaveMoodWithTrackers() {
    tapMedium();
    await saveMood(pendingMood, '', sleepHours, energyLevel);
    const newStreak = await updateStreak();
    setStreak(newStreak);
    setMoodSaved(true);
    setShowTrackers(false);
    success();
    getMoodHistory().then((h) => setRecentMoods(h.slice(0, 3)));
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{profile.name} 👋</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>{t.dayStreak}</Text>
            </View>
          </View>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{quote}"</Text>
            <TouchableOpacity style={styles.shareQuoteBtn} onPress={handleShareQuote}>
              <Text style={styles.shareQuoteText}>{t.shareQuote}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Mood Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {moodSaved ? t.moodSaved : t.moodQuestion}
            </Text>
            <Text style={styles.cardSubtitle}>{moodSaved ? t.sleepEnergySaved(sleepHours, energyLevel) : t.tapCheckIn}</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodBtn,
                    selectedMood === m.id && { backgroundColor: Colors.moods[m.id] + '20', borderColor: Colors.moods[m.id], borderWidth: 2 }
                  ]}
                  onPress={() => handleMoodSelect(m.id)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, selectedMood === m.id && { color: Colors.moods[m.id], fontWeight: '700' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sleep & Energy Trackers */}
            {showTrackers && (
              <View style={styles.trackersBox}>
                <View style={styles.trackerRow}>
                  <Text style={styles.trackerLabel}>{t.sleep}</Text>
                  <Text style={styles.trackerValue}>{sleepHours}h</Text>
                </View>
                <View style={styles.trackerBtns}>
                  {[4, 5, 6, 7, 8, 9, 10].map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.trackerChip, sleepHours === h && styles.trackerChipActive]}
                      onPress={() => { tapLight(); setSleepHours(h); }}
                    >
                      <Text style={[styles.trackerChipText, sleepHours === h && styles.trackerChipTextActive]}>{h}h</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.trackerRow, { marginTop: 12 }]}>
                  <Text style={styles.trackerLabel}>{t.energy}</Text>
                  <Text style={styles.trackerValue}>{'⚡'.repeat(energyLevel)}</Text>
                </View>
                <View style={styles.trackerBtns}>
                  {[1, 2, 3, 4, 5].map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.trackerChip, energyLevel === e && styles.trackerChipActive]}
                      onPress={() => { tapLight(); setEnergyLevel(e); }}
                    >
                      <Text style={[styles.trackerChipText, energyLevel === e && styles.trackerChipTextActive]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveTrackerBtn} onPress={handleSaveMoodWithTrackers}>
                  <Text style={styles.saveTrackerBtnText}>{t.saveCheckIn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>{t.quickActions}</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.primaryLight }]} onPress={() => router.push('/(tabs)/chat')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                <Text style={styles.actionEmoji}>💬</Text>
              </View>
              <Text style={styles.actionLabel}>{t.chatLabel}</Text>
              <Text style={styles.actionDesc}>{t.chatDesc}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.secondary + '20' }]} onPress={() => router.push('/(tabs)/journal')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.secondary }]}>
                <Text style={styles.actionEmoji}>📝</Text>
              </View>
              <Text style={styles.actionLabel}>{t.journalLabel}</Text>
              <Text style={styles.actionDesc}>{t.journalDesc}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.accent + '20' }]} onPress={() => router.push('/(tabs)/insights')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent }]}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>{t.insightsLabel}</Text>
              <Text style={styles.actionDesc}>{t.insightsDesc}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.success + '20' }]} onPress={() => router.push('/breathing')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.success }]}>
                <Text style={styles.actionEmoji}>🫁</Text>
              </View>
              <Text style={styles.actionLabel}>{t.breatheLabel}</Text>
              <Text style={styles.actionDesc}>{t.breatheDesc}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.primary + '20' }]} onPress={() => router.push('/programs')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                <Text style={styles.actionEmoji}>🧭</Text>
              </View>
              <Text style={styles.actionLabel}>{t.journeysLabel || 'Journeys'}</Text>
              <Text style={styles.actionDesc}>{t.journeysDesc || 'Guided programs'}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Moods */}
          {recentMoods.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t.recentCheckIns}</Text>
              <View style={styles.card}>
                {recentMoods.map((entry, i) => {
                  const mood = MOODS.find((m) => m.id === entry.mood) || { emoji: '😐', label: entry.mood };
                  const date = new Date(entry.date);
                  return (
                    <View key={i} style={[styles.recentRow, i < recentMoods.length - 1 && styles.recentRowBorder]}>
                      <View style={[styles.moodDot, { backgroundColor: Colors.moods[entry.mood] + '20' }]}>
                        <Text style={{ fontSize: 20 }}>{mood?.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentLabel}>{mood?.label}</Text>
                        <Text style={styles.recentDate}>
                          {date.toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={[styles.moodPill, { backgroundColor: Colors.moods[entry.mood] + '20' }]}>
                        <Text style={[styles.moodPillText, { color: Colors.moods[entry.mood] }]}>{mood?.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(Colors, isRTL) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'web' ? 24 : 16,
      paddingBottom: 32,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerTop: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500', textAlign: isRTL ? 'right' : 'left' },
    name: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    streakBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 12, alignItems: 'center' },
    streakFire: { fontSize: 22 },
    streakNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
    streakLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    quoteBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14 },
    quoteText: { color: '#fff', fontSize: 14, fontStyle: 'italic', lineHeight: 20, textAlign: 'center', marginBottom: 10 },
    shareQuoteBtn: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
    shareQuoteText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    content: { padding: 20, marginTop: -16 },
    card: {
      backgroundColor: Colors.card, borderRadius: 20, padding: 20,
      marginBottom: 20, shadowColor: Colors.primary,
      shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' },
    cardSubtitle: { fontSize: 13, color: Colors.textLight, marginBottom: 16, textAlign: isRTL ? 'right' : 'left' },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
    moodBtn: { alignItems: 'center', borderRadius: 14, padding: 10, borderWidth: 1.5, borderColor: Colors.border, flex: 1, marginHorizontal: 3 },
    moodEmoji: { fontSize: 26 },
    moodLabel: { fontSize: 11, color: Colors.textLight, marginTop: 4, fontWeight: '500' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    actionCard: { width: '47%', borderRadius: 18, padding: 14 },
    actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionEmoji: { fontSize: 22 },
    actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    actionDesc: { fontSize: 11, color: Colors.textLight, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    recentRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 12 },
    recentRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    moodDot: {
      width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
      marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0,
    },
    recentLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    recentDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    moodPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    moodPillText: { fontSize: 12, fontWeight: '600' },
    trackersBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
    trackerRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    trackerLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
    trackerValue: { fontSize: 14, fontWeight: '700', color: Colors.primary },
    trackerBtns: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    trackerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border },
    trackerChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    trackerChipText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
    trackerChipTextActive: { color: '#fff' },
    saveTrackerBtn: { marginTop: 14, backgroundColor: Colors.primary, borderRadius: 14, padding: 14, alignItems: 'center' },
    saveTrackerBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
