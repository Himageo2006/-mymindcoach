import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  SectionList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';
import { getCoachesForLanguage } from '../src/data/coaches';
import { getSelectedCoach, setSelectedCoach } from '../src/services/coachService';
import { getAppLanguage } from '../src/services/language';

const LANG_LABELS = {
  en: 'English', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German',
  tr: 'Turkish', pt: 'Portuguese', it: 'Italian', ru: 'Russian', hi: 'Hindi',
  id: 'Indonesian', ko: 'Korean', ja: 'Japanese', zh: 'Chinese', nl: 'Dutch',
  pl: 'Polish', th: 'Thai', vi: 'Vietnamese', ms: 'Malay', uk: 'Ukrainian', fa: 'Persian',
};
const LANG_FLAGS = {
  en: '🇬🇧', ar: '🇸🇦', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪',
  tr: '🇹🇷', pt: '🇵🇹', it: '🇮🇹', ru: '🇷🇺', hi: '🇮🇳',
  id: '🇮🇩', ko: '🇰🇷', ja: '🇯🇵', zh: '🇨🇳', nl: '🇳🇱',
  pl: '🇵🇱', th: '🇹🇭', vi: '🇻🇳', ms: '🇲🇾', uk: '🇺🇦', fa: '🇮🇷',
};

const GENDER_FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'female', label: '👩 Female' },
  { key: 'male',   label: '👨 Male' },
];
const LANG_FILTERS = [
  { key: 'all',     label: '🌍 All Coaches' },
  { key: 'native',  label: '🏠 Native Language' },
  { key: 'english', label: '🇬🇧 English' },
];

export default function CoachSelect() {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [allCoaches, setAllCoaches] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [genderFilter, setGenderFilter] = useState('all');
  const [langFilter, setLangFilter]     = useState('all');
  const [saving, setSaving]             = useState(false);
  const [userLang, setUserLang]         = useState('en');

  useEffect(() => {
    async function load() {
      const lang   = await getAppLanguage();
      const list   = getCoachesForLanguage(lang);
      const current = await getSelectedCoach(lang);
      setUserLang(lang);
      setAllCoaches(list);
      setSelected(current);
    }
    load();
  }, []);

  async function handleSelect(coach) {
    setSelected(coach);
    setSaving(true);
    await setSelectedCoach(coach);
    setSaving(false);
  }

  // Build sections: native group first, then one "In English" group
  const sections = useMemo(() => {
    let coaches = allCoaches;

    // gender filter
    if (genderFilter !== 'all') coaches = coaches.filter(c => c.gender === genderFilter);
    // lang filter
    if (langFilter === 'native')  coaches = coaches.filter(c => c.isNative);
    if (langFilter === 'english') coaches = coaches.filter(c => !c.isNative);

    const native  = coaches.filter(c => c.isNative);
    const english = coaches.filter(c => !c.isNative);

    const result = [];
    if (native.length > 0) {
      const flag = LANG_FLAGS[userLang] || '🌐';
      const label = LANG_LABELS[userLang] || 'Native';
      result.push({ title: `${flag} ${label} Coaches`, subtitle: 'Respond in your language', data: native });
    }
    if (english.length > 0) {
      result.push({ title: '🇬🇧 International Coaches', subtitle: 'Respond in English', data: english });
    }
    return result;
  }, [allCoaches, genderFilter, langFilter, userLang]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Coach</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.subtitle}>
              Native coaches speak your language. International coaches speak English. You can switch anytime.
            </Text>

            {/* Language filter */}
            <View style={styles.filterRow}>
              {LANG_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterTab, langFilter === f.key && styles.filterTabActive]}
                  onPress={() => setLangFilter(f.key)}
                >
                  <Text style={[styles.filterText, langFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gender filter */}
            <View style={[styles.filterRow, { marginTop: 0 }]}>
              {GENDER_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, genderFilter === f.key && styles.filterChipActive]}
                  onPress={() => setGenderFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, genderFilter === f.key && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item: coach }) => {
          const isSelected = selected?.id === coach.id;
          // For English coaches shown to non-English users, show their original language flag
          const origLang   = coach.id.split('_').pop(); // e.g. 'es' from 'sofia_es'
          const showBadge  = !coach.isNative && origLang && LANG_FLAGS[origLang];
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && { borderColor: coach.color, borderWidth: 2.5 }]}
              onPress={() => handleSelect(coach)}
              activeOpacity={0.85}
            >
              <View style={[styles.avatarCircle, { backgroundColor: coach.color + '22' }]}>
                <Text style={styles.avatarEmoji}>{coach.avatar}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.coachName, isSelected && { color: coach.color }]}>
                    {coach.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    {showBadge && (
                      <View style={styles.langBadge}>
                        <Text style={styles.langBadgeText}>{LANG_FLAGS[origLang]} EN</Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: coach.color }]}>
                        <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.specialty, { color: coach.color }]}>{coach.specialty}</Text>
                <Text style={styles.about}>{coach.about}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.confirmBtn, selected && { backgroundColor: selected.color }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')}
            disabled={!selected || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmText}>
                {selected ? `Start with ${selected.name}` : 'Select a Coach'}
              </Text>
            )}
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

function createStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', padding: 16,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { marginRight: 16 },
    backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { padding: 20, paddingBottom: 40 },
    subtitle: { fontSize: 13, color: Colors.textMuted, lineHeight: 19, marginBottom: 16 },
    filterRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14,
    },
    filterTab: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
    filterTextActive: { color: '#fff' },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
      backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    },
    filterChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
    filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
    filterChipTextActive: { color: Colors.primary },
    sectionHeader: { marginTop: 20, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    sectionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    card: {
      backgroundColor: Colors.card, borderRadius: 20, padding: 16,
      marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start',
      borderWidth: 1.5, borderColor: Colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    avatarCircle: {
      width: 62, height: 62, borderRadius: 31,
      justifyContent: 'center', alignItems: 'center', marginRight: 13,
    },
    avatarEmoji: { fontSize: 30 },
    cardBody: { flex: 1 },
    cardTop: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 3,
    },
    coachName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
    badgeRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
    langBadge: {
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
      backgroundColor: Colors.primaryLight,
    },
    langBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
    selectedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    selectedBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    specialty: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    about: { fontSize: 11, color: Colors.textLight, lineHeight: 17 },
    confirmBtn: {
      backgroundColor: Colors.primary, borderRadius: 16, padding: 18,
      alignItems: 'center', marginTop: 16, marginBottom: 16,
    },
    confirmText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
