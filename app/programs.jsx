import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';
import { PROGRAMS, getProgramProgress } from '../src/services/programs';
import { tapLight } from '../src/services/haptics';

export default function Programs() {
  const Colors = useColors();
  const [progress, setProgress] = useState({});

  useFocusEffect(
    useCallback(() => {
      Promise.all(PROGRAMS.map((p) => getProgramProgress(p.id).then((n) => [p.id, n])))
        .then((pairs) => setProgress(Object.fromEntries(pairs)));
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: Colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>Guided Journeys</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: Colors.textLight }]}>
          Short daily sessions with your coach. A little progress every day.
        </Text>

        {PROGRAMS.map((p) => {
          const done = progress[p.id] || 0;
          const total = p.days.length;
          const pct = Math.round((done / total) * 100);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { backgroundColor: Colors.card }]}
              activeOpacity={0.85}
              onPress={() => { tapLight(); router.push(`/program?id=${p.id}`); }}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: Colors.text }]}>{p.title}</Text>
                  <Text style={[styles.cardSub, { color: Colors.textLight }]}>{p.subtitle}</Text>
                </View>
              </View>
              <View style={[styles.barTrack, { backgroundColor: Colors.border || '#E0E0E0' }]}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: Colors.textLight }]}>
                {done === 0 ? `${total}-day journey` : done >= total ? 'Completed 🎉' : `Day ${done} of ${total}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back:         { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText:     { fontSize: 30, fontWeight: '300', marginTop: -4 },
  title:        { fontSize: 18, fontWeight: '700' },
  scroll:       { padding: 16, paddingBottom: 40 },
  intro:        { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card:         { borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji:        { fontSize: 30, marginRight: 12 },
  cardTitle:    { fontSize: 16, fontWeight: '700' },
  cardSub:      { fontSize: 13, marginTop: 2 },
  barTrack:     { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 8, fontWeight: '600' },
});
