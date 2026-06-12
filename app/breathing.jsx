import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../src/context/ThemeContext';
import { tapLight, tapMedium, success } from '../src/services/haptics';

// Step labels use i18n keys: 'inhale' | 'hold' | 'exhale'
const EXERCISES = [
  {
    id: 'box',
    nameKey: 'Box Breathing',
    emoji: '⬜',
    descKey: 'Used by Navy SEALs to stay calm under pressure',
    color: '#7C3AED',
    steps: [
      { labelKey: 'inhale', duration: 4 },
      { labelKey: 'hold', duration: 4 },
      { labelKey: 'exhale', duration: 4 },
      { labelKey: 'hold', duration: 4 },
    ],
  },
  {
    id: '478',
    nameKey: '4-7-8 Breathing',
    emoji: '😴',
    descKey: 'Reduces anxiety and helps you fall asleep',
    color: '#0891B2',
    steps: [
      { labelKey: 'inhale', duration: 4 },
      { labelKey: 'hold', duration: 7 },
      { labelKey: 'exhale', duration: 8 },
    ],
  },
  {
    id: 'calm',
    nameKey: 'Calm Breathing',
    emoji: '🌊',
    descKey: 'Simple slow breathing to reduce stress instantly',
    color: '#059669',
    steps: [
      { labelKey: 'inhale', duration: 5 },
      { labelKey: 'exhale', duration: 5 },
    ],
  },
  {
    id: 'energy',
    nameKey: 'Energizing Breath',
    emoji: '⚡',
    descKey: 'Quick breaths to boost energy and focus',
    color: '#D97706',
    steps: [
      { labelKey: 'inhale', duration: 2 },
      { labelKey: 'exhale', duration: 2 },
    ],
  },
];

export default function Breathing() {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (animRef.current) animRef.current.stop();
    };
  }, []);

  function startExercise(exercise) {
    tapMedium();
    setSelected(exercise);
    setRunning(false);
    setStepIndex(0);
    setCycles(0);
    setCountdown(exercise.steps[0].duration);
  }

  function startBreathing() {
    setRunning(true);
    setStepIndex(0);
    setCycles(0);
    runStep(selected, 0, 0);
  }

  function runStep(exercise, sIdx, cycleCount) {
    const step = exercise.steps[sIdx];
    setStepIndex(sIdx);
    setCountdown(step.duration);

    const toScale = step.labelKey === 'inhale' ? 1.4 : step.labelKey === 'exhale' ? 0.7 : scaleAnim._value;

    if (animRef.current) animRef.current.stop();
    animRef.current = Animated.timing(scaleAnim, {
      toValue: toScale,
      duration: step.duration * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animRef.current.start();

    let remaining = step.duration;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        const nextIdx = (sIdx + 1) % exercise.steps.length;
        const newCycles = nextIdx === 0 ? cycleCount + 1 : cycleCount;
        setCycles(newCycles);
        if (newCycles < 5) {
          tapLight();
          runStep(exercise, nextIdx, newCycles);
        } else {
          setRunning(false);
          setCycles(5);
          success();
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
      }
    }, 1000);
  }

  function stopExercise() {
    clearInterval(intervalRef.current);
    if (animRef.current) animRef.current.stop();
    setRunning(false);
    setStepIndex(0);
    setCountdown(selected?.steps[0]?.duration || 0);
    Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }

  if (selected) {
    const step = selected.steps[stepIndex];
    const isDone = !running && cycles === 5;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: selected.color + '15' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { stopExercise(); setSelected(null); }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selected.nameKey}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.exerciseContainer}>
          {isDone ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneEmoji}>✨</Text>
              <Text style={styles.doneTitle}>{t('wellDone')}</Text>
              <Text style={styles.doneDesc}>{t('completedCycles')}</Text>
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: selected.color }]} onPress={() => startBreathing()}>
                <Text style={styles.startBtnText}>{t('goAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backHomeBtn} onPress={() => setSelected(null)}>
                <Text style={[styles.backHomeBtnText, { color: selected.color }]}>{t('chooseAnother')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cycleText}>{running ? `Cycle ${cycles + 1} of 5` : t('readyToBegin')}</Text>

              <View style={styles.circleContainer}>
                <Animated.View style={[styles.outerCircle, { borderColor: selected.color + '40', transform: [{ scale: scaleAnim }] }]}>
                  <Animated.View style={[styles.innerCircle, { backgroundColor: selected.color }]}>
                    <Text style={styles.circleEmoji}>{selected.emoji}</Text>
                    {running && <Text style={styles.circleCountdown}>{countdown}</Text>}
                  </Animated.View>
                </Animated.View>
              </View>

              {running && (
                <Text style={[styles.stepLabel, { color: selected.color }]}>{step ? t(step.labelKey) : ''}</Text>
              )}

              <View style={styles.stepsRow}>
                {selected.steps.map((s, i) => (
                  <View key={i} style={[styles.stepPill, running && stepIndex === i && { backgroundColor: selected.color }]}>
                    <Text style={[styles.stepPillText, running && stepIndex === i && { color: '#fff' }]}>
                      {t(s.labelKey)} {s.duration}s
                    </Text>
                  </View>
                ))}
              </View>

              {!running ? (
                <TouchableOpacity style={[styles.startBtn, { backgroundColor: selected.color }]} onPress={startBreathing}>
                  <Text style={styles.startBtnText}>{t('startBreathing')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.stopBtn} onPress={stopExercise}>
                  <Text style={styles.stopBtnText}>{t('stop')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('breathingExercises')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.scroll}>
        <Text style={styles.pageSubtitle}>{t('chooseExercise')}</Text>

        {EXERCISES.map((ex) => (
          <TouchableOpacity key={ex.id} style={[styles.exCard, { borderLeftColor: ex.color }]} onPress={() => startExercise(ex)}>
            <Text style={styles.exEmoji}>{ex.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.nameKey}</Text>
              <Text style={styles.exDesc}>{ex.descKey}</Text>
              <View style={styles.exSteps}>
                {ex.steps.map((s, i) => (
                  <Text key={i} style={[styles.exStepBadge, { color: ex.color, borderColor: ex.color + '40', backgroundColor: ex.color + '15' }]}>
                    {t(s.labelKey)} {s.duration}s
                  </Text>
                ))}
              </View>
            </View>
            <Text style={[styles.exArrow, { color: ex.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function createStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { padding: 20 },
    pageSubtitle: { fontSize: 15, color: Colors.textLight, marginBottom: 20, textAlign: 'center' },
    exCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    exEmoji: { fontSize: 36, marginRight: 16 },
    exName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    exDesc: { fontSize: 13, color: Colors.textLight, marginBottom: 8, lineHeight: 18 },
    exSteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    exStepBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
    exArrow: { fontSize: 28, fontWeight: '300' },
    exerciseContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    cycleText: { fontSize: 16, color: Colors.textLight, marginBottom: 40, fontWeight: '600' },
    circleContainer: { marginBottom: 40 },
    outerCircle: { width: 220, height: 220, borderRadius: 110, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
    innerCircle: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center' },
    circleEmoji: { fontSize: 48 },
    circleCountdown: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
    stepLabel: { fontSize: 32, fontWeight: '800', marginBottom: 24 },
    stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 },
    stepPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.border },
    stepPillText: { fontSize: 13, fontWeight: '600', color: Colors.textLight },
    startBtn: { borderRadius: 16, paddingHorizontal: 48, paddingVertical: 16, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    startBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    stopBtn: { backgroundColor: Colors.border, borderRadius: 16, paddingHorizontal: 48, paddingVertical: 16 },
    stopBtnText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' },
    doneBox: { alignItems: 'center', padding: 24 },
    doneEmoji: { fontSize: 72, marginBottom: 16 },
    doneTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    doneDesc: { fontSize: 16, color: Colors.textLight, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    backHomeBtn: { marginTop: 16, padding: 12 },
    backHomeBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
