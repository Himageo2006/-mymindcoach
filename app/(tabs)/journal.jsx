import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform,
  Modal, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/context/ThemeContext';
import { saveJournalEntry, getJournalEntries } from '../../src/services/storage';
import { tapLight, tapMedium, success } from '../../src/services/haptics';

const SERVER_URL = 'https://mindtalk-server-production.up.railway.app';
const APP_KEY = 'mk-app-2024-xK9pL3mNqR7vW2jT';

export default function Journal() {
  const Colors = useColors();
  const { t, i18n } = useTranslation();
  const isRTL = ['ar', 'fa'].includes(i18n.language);
  const styles = createStyles(Colors, isRTL);

  const dateLocale = i18n.language === 'ar' ? 'ar-SA'
    : i18n.language === 'fa' ? 'fa-IR'
    : 'en-US';

  // Build prompts array from translations (falls back to English automatically)
  const PROMPTS = [
    t('journalPrompt0'),
    t('journalPrompt1'),
    t('journalPrompt2'),
    t('journalPrompt3'),
    t('journalPrompt4'),
    t('journalPrompt5'),
  ];

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [writing, setWriting] = useState(false);
  const [prompt] = useState(() => PROMPTS[new Date().getDay() % PROMPTS.length]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisEntry, setAnalysisEntry] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getJournalEntries().then(setEntries);
    }, [])
  );

  async function handleSave() {
    if (!text.trim()) return;
    tapMedium();
    await saveJournalEntry(text.trim());
    setText('');
    setWriting(false);
    success();
    getJournalEntries().then(setEntries);
  }

  async function handleAnalyze(entryText) {
    tapLight();
    setAnalysisEntry(entryText);
    setAnalysis(null);
    setAnalyzing(true);
    setShowAnalysis(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/analyze-journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-key': APP_KEY,
        },
        body: JSON.stringify({ text: entryText }),
      });
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis({ error: true });
      }
    } catch (e) {
      setAnalysis({ error: true });
    } finally {
      setAnalyzing(false);
    }
  }

  function renderEntry({ item, index }) {
    const date = new Date(item.date);
    const borderColors = [Colors.primary, Colors.secondary, Colors.accent, Colors.success, Colors.warning];
    const border = borderColors[index % borderColors.length];
    return (
      <View style={[styles.entryCard, isRTL
        ? { borderRightColor: border, borderRightWidth: 4, borderLeftWidth: 0 }
        : { borderLeftColor: border }
      ]}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>
            {date.toLocaleDateString(dateLocale, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.entryTime}>
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.entryText} numberOfLines={4}>{item.text}</Text>
        <TouchableOpacity style={styles.analyzeBtn} onPress={() => handleAnalyze(item.text)}>
          <Text style={styles.analyzeBtnText}>{t('coachInsights')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('myJournal')}</Text>
          <Text style={styles.headerSub}>
            {t('journalEntry', { count: entries.length })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setWriting(true)}>
          <Text style={styles.addBtnText}>{t('newEntry')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {writing ? (
          <View style={styles.writeContainer}>
            <View style={styles.promptBox}>
              <Text style={styles.promptText}>{prompt}</Text>
            </View>
            <TextInput
              style={styles.writeInput}
              placeholder={t('letThoughtsFlow')}
              placeholderTextColor={Colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              textAlign={isRTL ? 'right' : 'left'}
            />
            <Text style={styles.charCount}>{text.length} {t('characters')}</Text>
            <View style={styles.writeActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setWriting(false); setText(''); }}>
                <Text style={styles.cancelBtnText}>{t('discard')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !text.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!text.trim()}
              >
                <Text style={styles.saveBtnText}>{t('saveEntry')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📓</Text>
                <Text style={styles.emptyTitle}>{t('journalAwaits')}</Text>
                <Text style={styles.emptyText}>{t('journalEmptyText')}</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setWriting(true)}>
                  <Text style={styles.emptyBtnText}>{t('writeFirstEntry')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>

      {/* AI Analysis Modal */}
      <Modal visible={showAnalysis} transparent animationType="slide" onRequestClose={() => setShowAnalysis(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('journalInsights')}</Text>

            {analyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.analyzingText}>{t('analyzingEntry')}</Text>
                <Text style={styles.analyzingSubText}>{t('analyzingSubText')}</Text>
              </View>
            ) : analysis?.error ? (
              <View style={styles.analyzingBox}>
                <Text style={{ fontSize: 48 }}>😕</Text>
                <Text style={styles.analyzingText}>{t('analysisUnavailable')}</Text>
                <Text style={styles.analyzingSubText}>{t('tryAgainLater')}</Text>
              </View>
            ) : analysis ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Mood Badge */}
                <View style={styles.moodBadge}>
                  <Text style={styles.moodBadgeEmoji}>{analysis.moodEmoji}</Text>
                  <View>
                    <Text style={styles.moodBadgeLabel}>{t('detectedMood')}</Text>
                    <Text style={styles.moodBadgeValue}>{analysis.mood}</Text>
                  </View>
                </View>

                <View style={styles.insightRow}>
                  <Text style={styles.insightIcon}>💬</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>{t('whatISense')}</Text>
                    <Text style={styles.insightText}>{analysis.insight}</Text>
                  </View>
                </View>

                <View style={styles.insightRow}>
                  <Text style={styles.insightIcon}>🔄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightLabel}>{t('patternNoticed')}</Text>
                    <Text style={styles.insightText}>{analysis.pattern}</Text>
                  </View>
                </View>

                <View style={[styles.insightRow, { backgroundColor: Colors.success + '15' }]}>
                  <Text style={styles.insightIcon}>✨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightLabel, { color: Colors.success }]}>{t('yourStrength')}</Text>
                    <Text style={styles.insightText}>{analysis.strength}</Text>
                  </View>
                </View>

                <View style={[styles.insightRow, { backgroundColor: Colors.primary + '15' }]}>
                  <Text style={styles.insightIcon}>💡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.insightLabel, { color: Colors.primary }]}>{t('suggestion')}</Text>
                    <Text style={styles.insightText}>{analysis.tip}</Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAnalysis(false)}>
              <Text style={styles.modalCloseText}>{t('closeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(Colors, isRTL) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between', alignItems: 'center',
      padding: 20, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    headerSub: { fontSize: 13, color: Colors.textLight, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    addBtn: { backgroundColor: Colors.primary, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    list: { padding: 20, paddingBottom: 40 },
    entryCard: {
      backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 14,
      borderLeftWidth: isRTL ? 0 : 4,
      borderWidth: 1, borderColor: Colors.border,
    },
    entryHeader: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 10 },
    entryDate: { fontSize: 13, fontWeight: '700', color: Colors.text },
    entryTime: { fontSize: 12, color: Colors.textLight },
    entryText: { fontSize: 15, color: Colors.text, lineHeight: 24, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' },
    analyzeBtn: { flexDirection: 'row', alignSelf: isRTL ? 'flex-end' : 'flex-start', backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    analyzeBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
    writeContainer: { flex: 1, padding: 20 },
    promptBox: { backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14, marginBottom: 16 },
    promptText: { fontSize: 15, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
    writeInput: {
      flex: 1, backgroundColor: Colors.card, borderRadius: 18, padding: 18,
      fontSize: 16, color: Colors.text, textAlignVertical: 'top',
      borderWidth: 1, borderColor: Colors.border, lineHeight: 26,
    },
    charCount: { fontSize: 12, color: Colors.textMuted, textAlign: isRTL ? 'left' : 'right', marginTop: 6 },
    writeActions: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, marginTop: 16 },
    cancelBtn: { flex: 1, backgroundColor: Colors.border, borderRadius: 14, padding: 15, alignItems: 'center' },
    cancelBtnText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
    saveBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, padding: 15, alignItems: 'center', shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    saveBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
    emptyEmoji: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'center' },
    emptyText: { fontSize: 15, color: Colors.textLight, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
    emptyBtn: { backgroundColor: Colors.primary, borderRadius: 22, paddingHorizontal: 28, paddingVertical: 14 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20, textAlign: 'center' },
    analyzingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    analyzingText: { fontSize: 17, fontWeight: '700', color: Colors.text },
    analyzingSubText: { fontSize: 13, color: Colors.textLight },
    moodBadge: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primaryLight, borderRadius: 18, padding: 16, marginBottom: 14 },
    moodBadgeEmoji: { fontSize: 40 },
    moodBadgeLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    moodBadgeValue: { fontSize: 22, fontWeight: '800', color: Colors.primary, textTransform: 'capitalize' },
    insightRow: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, backgroundColor: Colors.background, borderRadius: 16, padding: 16, marginBottom: 10 },
    insightIcon: { fontSize: 24 },
    insightLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' },
    insightText: { fontSize: 15, color: Colors.text, lineHeight: 22, textAlign: isRTL ? 'right' : 'left' },
    modalClose: { marginTop: 16, padding: 16, alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14 },
    modalCloseText: { fontSize: 16, fontWeight: '700', color: Colors.textLight },
  });
}
