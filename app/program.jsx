import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';
import { getProgram, getProgramProgress, completeProgramDay, daySeed } from '../src/services/programs';
import { isPremium } from '../src/services/subscription';
import { tapMedium } from '../src/services/haptics';

export default function Program() {
  const Colors = useColors();
  const { id } = useLocalSearchParams();
  const program = getProgram(id);
  const [done, setDone] = useState(0);
  const [pro, setPro] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!program) return;
      getProgramProgress(program.id).then(setDone);
      isPremium().then(setPro);
    }, [program])
  );

  if (!program) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.text }}>Journey not found.</Text>
      </SafeAreaView>
    );
  }

  async function openDay(index) {
    const proLocked = index >= program.freeDays && !pro;
    if (proLocked) { router.push(`/paywall?goal=${encodeURIComponent(program.title.toLowerCase())}`); return; }
    if (index > done) return;                      // finish the previous day first
    tapMedium();
    await completeProgramDay(program.id, index);
    router.push(`/(tabs)/chat?seed=${encodeURIComponent(daySeed(program, index))}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: Colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]} numberOfLines={1}>{program.emoji} {program.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sub, { color: Colors.textLight }]}>{program.subtitle}</Text>

        {program.days.map((theme, i) => {
          const completed = i < done;
          const current = i === done;
          const proLocked = i >= program.freeDays && !pro;
          const seqLocked = i > done;
          const label = completed ? '✓' : proLocked ? '🔒' : `${i + 1}`;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={seqLocked && !proLocked ? 1 : 0.85}
              onPress={() => openDay(i)}
              style={[styles.dayCard, {
                backgroundColor: current ? Colors.primary + '18' : Colors.card,
                borderColor: current ? Colors.primary : 'transparent',
                opacity: seqLocked && !proLocked ? 0.5 : 1,
              }]}
            >
              <View style={[styles.dayNum, { backgroundColor: completed ? Colors.primary : Colors.border || '#E0E0E0' }]}>
                <Text style={[styles.dayNumText, { color: completed ? '#fff' : Colors.textLight }]}>{label}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dayTitle, { color: Colors.text }]}>Day {i + 1}</Text>
                <Text style={[styles.dayTheme, { color: Colors.textLight }]} numberOfLines={2}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </View>
              {current && <Text style={[styles.start, { color: Colors.primary }]}>Start →</Text>}
              {proLocked && <Text style={[styles.start, { color: Colors.primary }]}>Pro</Text>}
            </TouchableOpacity>
          );
        })}
        {!pro && (
          <Text style={[styles.note, { color: Colors.textLight }]}>
            Days 1–{program.freeDays} are free. Unlock the full journey with Pro.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 30, fontWeight: '300', marginTop: -4 },
  title:       { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll:      { padding: 16, paddingBottom: 40 },
  sub:         { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  dayCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 2, padding: 14, marginBottom: 10 },
  dayNum:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  dayNumText:  { fontSize: 14, fontWeight: '700' },
  dayTitle:    { fontSize: 14, fontWeight: '700' },
  dayTheme:    { fontSize: 13, marginTop: 2 },
  start:       { fontSize: 14, fontWeight: '700', marginLeft: 10 },
  note:        { fontSize: 13, textAlign: 'center', marginTop: 14, lineHeight: 19 },
});
