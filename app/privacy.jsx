import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'MyMindCoach collects only the information you provide directly: your first name and wellness goal during onboarding. Your journal entries and mood check-ins are stored only on your device and never transmitted to our servers.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your name and goal are used solely to personalize your experience within the app. Conversation messages are sent to our secure server to generate responses and are not stored after the response is delivered.',
  },
  {
    title: '3. Data Storage',
    body: 'All personal data — including journal entries, mood history, and your profile — is stored locally on your device using encrypted storage. We do not maintain a database of user content.',
  },
  {
    title: '4. Third-Party Services',
    body: 'MyMindCoach uses secure cloud technology to power conversations. Messages are processed by our server and are not stored after the response is delivered. We use RevenueCat to manage subscriptions securely.',
  },
  {
    title: '5. Subscriptions & Payments',
    body: 'Payment processing is handled entirely by Apple App Store or Google Play. MyMindCoach never sees or stores your payment information. Subscriptions can be cancelled at any time through your device\'s account settings.',
  },
  {
    title: '6. Children\'s Privacy',
    body: 'MyMindCoach is not intended for users under the age of 13. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us.',
  },
  {
    title: '7. Mental Health Disclaimer',
    body: 'MyMindCoach is a personal wellness companion and is not a substitute for professional mental health care. It does not provide medical advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please contact a qualified professional or crisis helpline immediately.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of any changes by updating the date at the bottom of this page. Continued use of the app after changes constitutes acceptance of the new policy.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at: support@mymindcoach.app',
  },
];

export default function Privacy() {
  const Colors = useColors();
  const styles = createStyles(Colors);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.appName}>MyMindCoach</Text>
        <Text style={styles.updated}>Last updated: May 2026</Text>
        <Text style={styles.intro}>
          Your privacy matters to us. This policy explains what information MyMindCoach collects, how we use it, and how we protect it.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>© 2026 MyMindCoach. All rights reserved.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { marginRight: 16 },
    backText: { fontSize: 16, color: C.primary, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    scroll: { padding: 24 },
    appName: { fontSize: 26, fontWeight: '800', color: C.primary, marginBottom: 4 },
    updated: { fontSize: 13, color: C.textMuted, marginBottom: 16 },
    intro: { fontSize: 15, color: C.textLight, lineHeight: 24, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8 },
    sectionBody: { fontSize: 14, color: C.textLight, lineHeight: 22 },
    footer: { fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 32 },
  });
}
