import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../src/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveCheckupResult, scoreCheckup, markCheckupDoneThisSession } from '../src/services/checkup';
import { tapLight, tapMedium } from '../src/services/haptics';
import { useCheckupI18n } from '../src/i18n/checkupI18n';

function buildQuestions(c) {
  return [
    {
      key: 'mood',
      question: c.moodQ,
      subtitle: c.moodSub,
      options: [
        { label: c.moodOpt1, emoji: '😔', score: 1 },
        { label: c.moodOpt2, emoji: '😟', score: 2 },
        { label: c.moodOpt3, emoji: '😐', score: 3 },
        { label: c.moodOpt4, emoji: '🙂', score: 4 },
        { label: c.moodOpt5, emoji: '😊', score: 5 },
      ],
    },
    {
      key: 'sleep',
      question: c.sleepQ,
      subtitle: c.sleepSub,
      options: [
        { label: c.sleepOpt1, emoji: '😫', score: 1 },
        { label: c.sleepOpt2, emoji: '😴', score: 2 },
        { label: c.sleepOpt3, emoji: '🛌', score: 3 },
        { label: c.sleepOpt4, emoji: '😌', score: 4 },
        { label: c.sleepOpt5, emoji: '✨', score: 5 },
      ],
    },
    {
      key: 'stress',
      question: c.stressQ,
      subtitle: c.stressSub,
      options: [
        { label: c.stressOpt1, emoji: '🌋', score: 1 },
        { label: c.stressOpt2, emoji: '😰', score: 2 },
        { label: c.stressOpt3, emoji: '😤', score: 3 },
        { label: c.stressOpt4, emoji: '🧘', score: 4 },
        { label: c.stressOpt5, emoji: '🌿', score: 5 },
      ],
    },
    {
      key: 'topic',
      question: c.topicQ,
      subtitle: c.topicSub,
      options: [
        { label: c.topicOpt1, emoji: '💭', score: 3 },
        { label: c.topicOpt2, emoji: '🔥', score: 3 },
        { label: c.topicOpt3, emoji: '💔', score: 3 },
        { label: c.topicOpt4, emoji: '🌧️', score: 3 },
        { label: c.topicOpt5, emoji: '💬', score: 3 },
      ],
    },
    {
      key: 'duration',
      question: c.durQ,
      subtitle: c.durSub,
      options: [
        { label: c.durOpt1, emoji: '📅', score: 4 },
        { label: c.durOpt2, emoji: '🗓️', score: 3 },
        { label: c.durOpt3, emoji: '📆', score: 3 },
        { label: c.durOpt4, emoji: '🕐', score: 2 },
        { label: c.durOpt5, emoji: '⏳', score: 1 },
      ],
    },
  ];
}

export default function MentalCheckup({ onComplete } = {}) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const { i18n } = useTranslation();
  const c = useCheckupI18n(i18n.language);
  const QUESTIONS = buildQuestions(c);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [wellness, setWellness] = useState(null);

  const questionFade = useRef(new Animated.Value(1)).current;
  const questionSlide = useRef(new Animated.Value(0)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  const progress = (step / QUESTIONS.length) * 100;

  function animateNextQuestion(callback) {
    Animated.parallel([
      Animated.timing(questionFade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(questionSlide, { toValue: -30, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      callback();
      questionSlide.setValue(30);
      Animated.parallel([
        Animated.timing(questionFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(questionSlide, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  function showResult(score) {
    setWellness(score);
    setDone(true);
    Animated.timing(resultFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }

  async function handleAnswer(option) {
    tapLight();
    const newAnswers = { ...answers, [QUESTIONS[step].key]: option };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      animateNextQuestion(() => setStep(s => s + 1));
    } else {
      const score = scoreCheckup(newAnswers);
      try { await saveCheckupResult({ answers: newAnswers, score, date: Date.now() }); } catch (_) {}
      showResult(score);
    }
  }

  function handleStartSession() {
    tapMedium();
    if (onComplete) {
      onComplete();
    } else {
      router.back();
    }
  }

  const q = QUESTIONS[step];
  const questionOf = c.questionOf
    .replace('{{n}}', step + 1)
    .replace('{{total}}', QUESTIONS.length);

  if (done && wellness) {
    const wellnessLabel =
      wellness.label === 'Good' ? c.wellnessGood :
      wellness.label === 'Moderate' ? c.wellnessMod :
      c.wellnessLow;

    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.resultContainer, { opacity: resultFade }]}>
          <Text style={styles.resultEmoji}>{wellness.emoji}</Text>
          <Text style={styles.resultTitle}>{c.resultTitle}</Text>
          <Text style={styles.resultSubtitle}>{c.resultSub}</Text>

          <View style={[styles.scoreCard, { borderColor: wellness.color }]}>
            <Text style={[styles.scoreLabel, { color: wellness.color }]}>{wellnessLabel}</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{c.focus}</Text>
            <Text style={styles.summaryValue}>{answers.topic?.emoji} {answers.topic?.label}</Text>
            <Text style={styles.summaryTitle}>{c.feelingFor}</Text>
            <Text style={styles.summaryValue}>{answers.duration?.label}</Text>
          </View>

          <Text style={styles.readyText}>{c.coachReady}</Text>

          <TouchableOpacity style={[styles.startBtn, { backgroundColor: wellness.color }]} onPress={handleStartSession}>
            <Text style={styles.startBtnText}>{c.start}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.progressLabel}>
        <Text style={styles.stepText}>{questionOf}</Text>
        <TouchableOpacity onPress={async () => {
          markCheckupDoneThisSession();
          // Clear old result so skipping doesn't show stale checkup data
          await AsyncStorage.removeItem('last_checkup_result');
          onComplete ? onComplete() : router.back();
        }}>
          <Text style={styles.skipText}>{c.skip}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: questionFade, transform: [{ translateY: questionSlide }] }]}>
        <Text style={styles.question}>{q.question}</Text>
        <Text style={styles.questionSub}>{q.subtitle}</Text>

        <View style={styles.optionsGrid}>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={styles.optionCard}
              onPress={() => handleAnswer(opt)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function createStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    progressTrack: { height: 4, backgroundColor: Colors.border, width: '100%' },
    progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
    progressLabel: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    stepText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
    skipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
    question: {
      fontSize: 26,
      fontWeight: '800',
      color: Colors.text,
      lineHeight: 34,
      marginBottom: 10,
    },
    questionSub: {
      fontSize: 14,
      color: Colors.textMuted,
      lineHeight: 20,
      marginBottom: 36,
    },
    optionsGrid: { gap: 12 },
    optionCard: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    optionEmoji: { fontSize: 28 },
    optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
    resultContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 40,
    },
    resultEmoji: { fontSize: 60, marginBottom: 16 },
    resultTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    resultSubtitle: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginBottom: 20 },
    scoreCard: {
      borderWidth: 2,
      borderRadius: 20,
      paddingHorizontal: 32,
      paddingVertical: 14,
      marginBottom: 28,
    },
    scoreLabel: { fontSize: 22, fontWeight: '800' },
    summaryBox: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: 6,
    },
    summaryTitle: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    readyText: { fontSize: 15, color: Colors.textLight, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
    startBtn: {
      width: '100%',
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
    },
    startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  });
}
