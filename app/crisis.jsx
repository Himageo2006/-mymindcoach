import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../src/context/ThemeContext';

const HELPLINES = [
  { country: '🌍 International', name: 'Befrienders Worldwide', number: 'www.befrienders.org', isWeb: true },
  { country: '🇺🇸 USA', name: '988 Suicide & Crisis Lifeline', number: '988', isWeb: false },
  { country: '🇸🇦 Saudi Arabia', name: 'Mental Health Helpline', number: '920033360', isWeb: false },
  { country: '🇦🇪 UAE', name: 'National Crisis Line', number: '800HOPE', isWeb: false },
  { country: '🇪🇬 Egypt', name: 'Mental Health Helpline', number: '08008880700', isWeb: false },
  { country: '🇬🇧 UK', name: 'Samaritans', number: '116123', isWeb: false },
  { country: '🇦🇺 Australia', name: 'Lifeline', number: '131114', isWeb: false },
  { country: '🇨🇦 Canada', name: 'Crisis Services Canada', number: '1-833-456-4566', isWeb: false },
  { country: '🇩🇪 Germany', name: 'Telefonseelsorge', number: '0800111 0 111', isWeb: false },
  { country: '🇫🇷 France', name: 'Numéro National Prévention Suicide', number: '3114', isWeb: false },
  { country: '🇪🇸 Spain', name: 'Teléfono de la Esperanza', number: '717003717', isWeb: false },
  { country: '🇹🇷 Turkey', name: 'ALO 182', number: '182', isWeb: false },
  { country: '🇮🇳 India', name: 'iCall', number: '9152987821', isWeb: false },
  { country: '🇧🇷 Brazil', name: 'CVV', number: '188', isWeb: false },
];

export default function Crisis() {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = createStyles(Colors);

  function handleCall(item) {
    if (item.isWeb) {
      Linking.openURL(`https://${item.number}`);
    } else {
      Linking.openURL(`tel:${item.number}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('crisisSupportTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.alertBox}>
          <Text style={styles.alertEmoji}>🆘</Text>
          <Text style={styles.alertTitle}>{t('youAreNotAlone')}</Text>
          <Text style={styles.alertText}>{t('crisisAlertText')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('emergencyHelplines')}</Text>

        {HELPLINES.map((item, i) => (
          <TouchableOpacity key={i} style={styles.card} onPress={() => handleCall(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.country}>{item.country}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.number}>{item.number}</Text>
            </View>
            <View style={styles.callBtn}>
              <Text style={styles.callIcon}>{item.isWeb ? '🌐' : '📞'}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.reminderBox}>
          <Text style={styles.reminderText}>{t('crisisReminder')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn: { marginRight: 16 },
    backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { padding: 20 },
    alertBox: { backgroundColor: '#FEF2F2', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#FCA5A5' },
    alertEmoji: { fontSize: 48, marginBottom: 12 },
    alertTitle: { fontSize: 22, fontWeight: '800', color: '#DC2626', marginBottom: 8 },
    alertText: { fontSize: 14, color: '#7F1D1D', textAlign: 'center', lineHeight: 22 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    country: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 2 },
    name: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    number: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    callBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    callIcon: { fontSize: 22 },
    reminderBox: { backgroundColor: Colors.primaryLight, borderRadius: 16, padding: 20, marginTop: 8, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: Colors.primary },
    reminderText: { fontSize: 14, color: Colors.text, lineHeight: 22, textAlign: 'center' },
  });
}
