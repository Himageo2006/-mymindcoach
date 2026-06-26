import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, I18nManager, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/context/ThemeContext';
import { getMoodHistory, getStreak, getUserProfile } from '../../src/services/storage';
import { useInsightsI18n } from '../../src/i18n/insightsI18n';

const SCREEN_W = Dimensions.get('window').width;
const BAR_WIDTH = (SCREEN_W - 80) / 7;

const MOOD_SCORES = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
const MOOD_EMOJIS = { great: '😄', good: '🙂', okay: '😐', bad: '😔', awful: '😢' };

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
}

export default function Insights() {
  const Colors = useColors();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const t = useInsightsI18n(lang);

  const isRTL = lang === 'ar' || lang === 'fa';

  const MOOD_LABELS = useMemo(() => ({
    great: t.moodGreat,
    good: t.moodGood,
    okay: t.moodOkay,
    bad: t.moodBad,
    awful: t.moodAwful,
  }), [lang]);

  const styles = createStyles(Colors, isRTL);

  const [moodHistory, setMoodHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [name, setName] = useState('');

  useFocusEffect(
    useCallback(() => {
      getMoodHistory().then(setMoodHistory);
      getStreak().then(setStreak);
      getUserProfile().then(({ name }) => setName(name));
      // Ask for a rating at this positive, reflective moment (fires once, when engaged)
      import('../../src/services/review').then(({ maybeRequestReview }) => maybeRequestReview()).catch(() => {});
    }, [])
  );

  const last7Days = getLast7Days();
  const moodByDay = last7Days.map((day) => {
    const entry = moodHistory.find((m) => new Date(m.date).toDateString() === day);
    return { day, mood: entry?.mood || null };
  });

  const totalEntries = moodHistory.length;
  const avgScore = totalEntries
    ? (moodHistory.reduce((sum, m) => sum + (MOOD_SCORES[m.mood] || 0), 0) / totalEntries)
    : 0;

  const moodCounts = moodHistory.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  function getScoreColor(score) {
    if (score >= 4.5) return Colors.moods.great;
    if (score >= 3.5) return Colors.moods.good;
    if (score >= 2.5) return Colors.moods.okay;
    if (score >= 1.5) return Colors.moods.bad;
    return Colors.moods.awful;
  }

  const avgScoreColor = getScoreColor(avgScore);

  function buildTopMoodDesc(n) {
    const s = n > 1 ? (lang === 'ar' || lang === 'fa' ? 'ا' : 's') : '';
    return t.topMoodDesc.replace('{{n}}', n).replace('{{s}}', s);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{streak}</Text>
            <Text style={styles.statLabel}>{t.dayStreak}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.success + '20' }]}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={[styles.statNum, { color: Colors.success }]}>{totalEntries}</Text>
            <Text style={styles.statLabel}>{t.checkIns}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.secondary + '20' }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statNum, { color: avgScoreColor }]}>{avgScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t.avgMood}</Text>
          </View>
        </View>

        {/* 7-Day Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t.chartTitle}</Text>
          <Text style={styles.chartSub}>{t.chartSub}</Text>
          <View style={styles.chartBars}>
            {moodByDay.map(({ day, mood }, i) => {
              const score = mood ? MOOD_SCORES[mood] : 0;
              const barH = mood ? Math.max((score / 5) * 90, 8) : 6;
              const barColor = mood ? Colors.moods[mood] : Colors.border;
              const dayLabel = new Date(day).toLocaleDateString(t.locale, { weekday: 'short' });
              const isToday = new Date(day).toDateString() === new Date().toDateString();
              return (
                <View key={i} style={styles.barCol}>
                  {mood && <Text style={styles.barEmoji}>{MOOD_EMOJIS[mood]}</Text>}
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: barH, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.barDay, isToday && styles.barDayToday]}>
                    {isToday ? t.today : dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Mood */}
        {topMood && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>🏆</Text>
              <Text style={styles.insightTitle}>{t.topMoodTitle}</Text>
            </View>
            <Text style={styles.insightValue}>
              {MOOD_EMOJIS[topMood[0]]} {MOOD_LABELS[topMood[0]]}
            </Text>
            <Text style={styles.insightDesc}>
              {buildTopMoodDesc(topMood[1])}
            </Text>
          </View>
        )}

        {/* Mood Breakdown */}
        {totalEntries > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.chartTitle}>{t.breakdownTitle}</Text>
            {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
              <View key={mood} style={styles.breakdownRow}>
                <Text style={styles.breakdownEmoji}>{MOOD_EMOJIS[mood]}</Text>
                <Text style={styles.breakdownLabel}>{MOOD_LABELS[mood]}</Text>
                <View style={styles.breakdownBarTrack}>
                  <View style={[styles.breakdownBar, { width: `${(count / totalEntries) * 100}%`, backgroundColor: Colors.moods[mood] }]} />
                </View>
                <Text style={styles.breakdownCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {totalEntries === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.emptyText}>{t.emptyText}</Text>
          </View>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>{t.tipTitle}</Text>
          <Text style={styles.tipText}>{t.tipText}</Text>
        </View>

        {/* Citations & Research Basis */}
        <View style={styles.citationsCard}>
          <Text style={styles.citationsTitle}>📚 Research Basis</Text>
          <Text style={styles.citationsDesc}>
            The mood tracking and wellness insights in MindTalk are based on established research in cognitive behavioral therapy (CBT) and positive psychology. MindTalk is a general wellness app and does not provide medical diagnosis or treatment.
          </Text>
          <View style={styles.citationsList}>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apa.org/topics/cognitive-behavioral-therapy')}>
              <Text style={styles.citationLink}>• APA: Cognitive Behavioral Therapy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.nimh.nih.gov/health/topics/psychotherapies')}>
              <Text style={styles.citationLink}>• NIH: Psychotherapy & Mental Wellness</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apa.org/topics/mindfulness')}>
              <Text style={styles.citationLink}>• APA: Mindfulness Research</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.citationsDisclaimer}>
            ⚕️ MindTalk is not a medical app. For medical concerns, please consult a licensed healthcare professional.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(Colors, isRTL) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { padding: 24, paddingBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4, textAlign: isRTL ? 'right' : 'left' },
    statsRow: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: 'center' },
    statEmoji: { fontSize: 24, marginBottom: 6 },
    statNum: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2, fontWeight: '500', textAlign: 'center' },
    chartCard: { backgroundColor: Colors.card, borderRadius: 20, margin: 20, marginTop: 4, padding: 20, shadowColor: Colors.primary, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    chartTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    chartSub: { fontSize: 12, color: Colors.textLight, marginBottom: 20, marginTop: 4, textAlign: isRTL ? 'right' : 'left' },
    chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
    barCol: { alignItems: 'center', width: BAR_WIDTH },
    barEmoji: { fontSize: 14, marginBottom: 4 },
    barTrack: { height: 90, justifyContent: 'flex-end' },
    bar: { width: BAR_WIDTH - 10, borderRadius: 6, minHeight: 6 },
    barDay: { fontSize: 10, color: Colors.textMuted, marginTop: 6, fontWeight: '500' },
    barDayToday: { color: Colors.primary, fontWeight: '700' },
    insightCard: { backgroundColor: Colors.primaryLight, borderRadius: 20, marginHorizontal: 20, marginBottom: 16, padding: 20 },
    insightHeader: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 8 },
    insightIcon: { fontSize: 20, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 },
    insightTitle: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
    insightValue: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' },
    insightDesc: { fontSize: 14, color: Colors.textLight, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' },
    breakdownCard: { backgroundColor: Colors.card, borderRadius: 20, marginHorizontal: 20, marginBottom: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    breakdownRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 12 },
    breakdownEmoji: { fontSize: 18, width: 28, textAlign: isRTL ? 'right' : 'left' },
    breakdownLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, width: 60 },
    breakdownBarTrack: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, marginHorizontal: 10, overflow: 'hidden' },
    breakdownBar: { height: 8, borderRadius: 4 },
    breakdownCount: { fontSize: 13, fontWeight: '700', color: Colors.textLight, width: 24, textAlign: isRTL ? 'left' : 'right' },
    tipCard: { backgroundColor: Colors.warning + '20', borderRadius: 20, marginHorizontal: 20, marginBottom: 30, padding: 20, borderLeftWidth: isRTL ? 0 : 4, borderLeftColor: Colors.warning, borderRightWidth: isRTL ? 4 : 0, borderRightColor: Colors.warning },
    tipTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' },
    tipText: { fontSize: 14, color: Colors.textLight, lineHeight: 22, textAlign: isRTL ? 'right' : 'left' },
    empty: { alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 22 },
    citationsCard: { backgroundColor: Colors.card, borderRadius: 20, marginHorizontal: 20, marginBottom: 30, padding: 20, borderWidth: 1, borderColor: Colors.border },
    citationsTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    citationsDesc: { fontSize: 13, color: Colors.textLight, lineHeight: 20, marginBottom: 12 },
    citationsList: { gap: 8, marginBottom: 12 },
    citationLink: { fontSize: 13, color: Colors.primary, lineHeight: 20, textDecorationLine: 'underline' },
    citationsDisclaimer: { fontSize: 12, color: Colors.textLight, lineHeight: 18, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  });
}
