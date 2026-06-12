import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';

export default function Paywall() {
  const Colors = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={[styles.title, { color: Colors.text }]}>All Features Are Free</Text>
        <Text style={[styles.desc, { color: Colors.textLight }]}>
          All coaching sessions, journal entries, mood tracking, insights, and breathing exercises
          are completely free in this version of MindTalk.
        </Text>

        <View style={[styles.featureList, { backgroundColor: Colors.card }]}>
          {[
            '💬 Unlimited AI coaching sessions',
            '📝 Unlimited journal entries',
            '📊 Full mood history & insights',
            '🎤 Voice messages',
            '🫁 Breathing exercises',
            '🌍 30+ coaches in multiple languages',
          ].map((f, i) => (
            <Text key={i} style={[styles.feature, { color: Colors.text }]}>✓  {f}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnText}>Start Using MindTalk →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emoji:     { fontSize: 56, marginBottom: 16 },
  title:     { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  desc:      { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featureList: { width: '100%', borderRadius: 16, padding: 20, marginBottom: 28 },
  feature:   { fontSize: 15, paddingVertical: 6 },
  btn:       { width: '100%', padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
});
