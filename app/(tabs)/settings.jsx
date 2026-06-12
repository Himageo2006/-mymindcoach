import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Modal, FlatList, Switch, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors, useTheme } from '../../src/context/ThemeContext';
import { isPremium, getActivePlan, PLANS, resetMessageCount } from '../../src/services/subscription';
import {
  LANGUAGES, getAppLanguage, setAppLanguage,
  getChatLanguage, setChatLanguage, isRTLLang
} from '../../src/services/language';
import {
  requestNotificationPermission, isNotificationsEnabled,
  getNotificationTime, scheduleDaily, cancelNotifications
} from '../../src/services/notifications';
import { getSelectedCoach } from '../../src/services/coachService';
import { resetOnboarding, getUserProfile } from '../../src/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_LANGUAGES = [
  { code: 'auto', label: 'Auto Detect', flag: '🌐' },
  ...LANGUAGES,
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const isRTL = isRTLLang(i18n.language);
  const styles = createStyles(Colors, isRTL);

  const [premium, setPremium] = useState(false);
  const [activePlan, setActivePlan] = useState('free');
  const [appLang, setAppLang] = useState('en');
  const [chatLang, setChatLang] = useState('auto');
  const [showAppLangModal, setShowAppLangModal] = useState(false);
  const [showChatLangModal, setShowChatLangModal] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(9);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [currentCoach, setCurrentCoach] = useState(null);
  const [userGender, setUserGender] = useState(null);

  useEffect(() => {
    isPremium().then(setPremium);
    getActivePlan().then(setActivePlan);
    getAppLanguage().then(lang => {
      setAppLang(lang);
      getSelectedCoach(lang).then(setCurrentCoach);
    });
    getChatLanguage().then(setChatLang);
    isNotificationsEnabled().then(setNotifEnabled);
    getNotificationTime().then(({ hour }) => setNotifHour(hour));
    getUserProfile().then(p => setUserGender(p.gender));
  }, []);

  async function handleGenderChange(g) {
    setUserGender(g);
    await AsyncStorage.setItem('user_gender', g);
  }

  async function handleNotifToggle(value) {
    if (value) {
      const granted = Platform.OS === 'web' ? true : await requestNotificationPermission();
      if (granted) {
        await scheduleDaily(notifHour, 0, appLang);
        setNotifEnabled(true);
      }
    } else {
      await cancelNotifications();
      setNotifEnabled(false);
    }
  }

  async function handleTimeSelect(hour) {
    setNotifHour(hour);
    if (notifEnabled) await scheduleDaily(hour, 0, appLang);
    setShowTimeModal(false);
  }

  async function handleAppLang(code) {
    const wasRTL = isRTLLang(appLang);
    const willBeRTL = isRTLLang(code);
    await setAppLanguage(code);
    await setChatLanguage('auto');
    setAppLang(code);
    setChatLang('auto');
    setShowAppLangModal(false);
    if (wasRTL !== willBeRTL) {
      Alert.alert(
        willBeRTL ? 'تفعيل RTL' : 'Layout Changed',
        willBeRTL
          ? 'تم تفعيل الكتابة من اليمين إلى اليسار. أعد تشغيل التطبيق للحصول على أفضل تجربة.'
          : 'Restart the app for the new layout direction to take full effect.',
        [{ text: willBeRTL ? 'حسناً' : 'OK' }]
      );
    }
  }

  async function handleChatLang(code) {
    await setChatLanguage(code);
    setChatLang(code);
    setShowChatLangModal(false);
  }

  const appLangInfo = LANGUAGES.find(l => l.code === appLang) || LANGUAGES[0];
  const chatLangInfo = CHAT_LANGUAGES.find(l => l.code === chatLang) || CHAT_LANGUAGES[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('settings')}</Text>

        {/* Plan Card */}
        <TouchableOpacity
          style={[styles.premiumCard, premium && styles.premiumCardActive]}
          onPress={() => !premium && router.push('/paywall')}
          activeOpacity={premium ? 1 : 0.8}
        >
          <Text style={styles.premiumEmoji}>{premium ? '👑' : '🔓'}</Text>
          <View style={{ flex: 1 }}>
            {premium ? (
              <>
                <View style={styles.planBadgeRow}>
                  <Text style={styles.premiumTitle}>{t('proPlanActive')}</Text>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>
                      {activePlan === 'pro_annual' ? '📅 Annual' : '🗓 Monthly'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.premiumDesc}>
                  {activePlan === 'pro_annual'
                    ? `${PLANS.pro_annual.price} · renews yearly`
                    : `${PLANS.pro_monthly.price} · renews monthly`}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.premiumTitle}>{t('upgradeToPremium')}</Text>
                <Text style={styles.premiumDesc}>{t('proDesc')}</Text>
              </>
            )}
          </View>
          {!premium && <Text style={styles.premiumArrow}>{isRTL ? '←' : '→'}</Text>}
          {premium && <Text style={styles.premiumCheck}>✓</Text>}
        </TouchableOpacity>

        {/* Your Coach */}
        <Text style={styles.sectionHeader}>{t('yourCoach')}</Text>
        <TouchableOpacity
          style={styles.coachRow}
          onPress={() => router.push('/coach-select')}
          activeOpacity={0.8}
        >
          <View style={[styles.coachAvatarCircle, { backgroundColor: (currentCoach?.color || Colors.primary) + '22' }]}>
            <Text style={styles.coachAvatarEmoji}>{currentCoach?.avatar || '👩‍⚕️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachName}>{currentCoach?.name || 'Dr. Sarah'}</Text>
            <Text style={styles.coachSpecialty}>{currentCoach?.specialty || 'Wellness Coach'}</Text>
          </View>
          <Text style={styles.langArrow}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>

        {/* Profile Section */}
        <Text style={styles.sectionHeader}>{t('profileSection')}</Text>
        <View style={styles.langRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.langLabel}>{t('yourGender')}</Text>
            <Text style={styles.langSub}>{t('genderHelps')}</Text>
          </View>
          <View style={styles.genderPicker}>
            {[
              { id: 'male',   emoji: '👨', label: 'Male' },
              { id: 'female', emoji: '👩', label: 'Female' },
              { id: 'other',  emoji: '—',  label: 'Other' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.genderChip, userGender === opt.id && styles.genderChipActive]}
                onPress={() => handleGenderChange(opt.id)}
              >
                <Text style={[styles.genderChipText, userGender === opt.id && styles.genderChipTextActive]}>
                  {opt.emoji} {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionHeader}>{t('appearanceSection')}</Text>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.langLabel}>{t('darkMode')}</Text>
            <Text style={styles.langSub}>{isDark ? t('darkModeOn') : t('darkModeOff')}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Language Section */}
        <Text style={styles.sectionHeader}>{t('languageSection')}</Text>

        <TouchableOpacity style={styles.langRow} onPress={() => setShowAppLangModal(true)}>
          <View>
            <Text style={styles.langLabel}>{t('appLanguageLabel')}</Text>
            <Text style={styles.langSub}>{t('appLanguageSub')}</Text>
          </View>
          <View style={styles.langValue}>
            <Text style={styles.langFlag}>{appLangInfo.flag}</Text>
            <Text style={styles.langName}>{appLangInfo.label}</Text>
            <Text style={styles.langArrow}>{isRTL ? '‹' : '›'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langRow} onPress={() => setShowChatLangModal(true)}>
          <View>
            <Text style={styles.langLabel}>{t('chatLanguageLabel')}</Text>
            <Text style={styles.langSub}>{t('chatLanguageSub')}</Text>
          </View>
          <View style={styles.langValue}>
            <Text style={styles.langFlag}>{chatLangInfo.flag}</Text>
            <Text style={styles.langName}>{chatLangInfo.label}</Text>
            <Text style={styles.langArrow}>{isRTL ? '‹' : '›'}</Text>
          </View>
        </TouchableOpacity>

        {/* Notifications Section */}
        <Text style={styles.sectionHeader}>{t('notificationsSection')}</Text>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.langLabel}>{t('dailyReminder')}</Text>
            <Text style={styles.langSub}>{t('dailyReminderSub')}</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleNotifToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {notifEnabled && (
          <TouchableOpacity style={styles.langRow} onPress={() => setShowTimeModal(true)}>
            <View>
              <Text style={styles.langLabel}>{t('reminderTime')}</Text>
              <Text style={styles.langSub}>{t('reminderTimeSub')}</Text>
            </View>
            <View style={styles.langValue}>
              <Text style={styles.langName}>
                {notifHour === 0 ? '12:00 AM' : notifHour < 12 ? `${notifHour}:00 AM` : notifHour === 12 ? '12:00 PM' : `${notifHour - 12}:00 PM`}
              </Text>
              <Text style={styles.langArrow}>{isRTL ? '‹' : '›'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('privacySecurity')}</Text>
          <Text style={styles.infoText}>{t('privacyText')}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('aboutMyMindCoach')}</Text>
          <Text style={styles.infoText}>{t('aboutText')}</Text>
        </View>

        <TouchableOpacity style={[styles.linkRow, styles.crisisRow]} onPress={() => router.push('/crisis')}>
          <Text style={styles.linkText}>{t('crisisHelplines')}</Text>
          <Text style={styles.linkArrow}>{isRTL ? '←' : '→'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy')}>
          <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
          <Text style={styles.linkArrow}>{isRTL ? '←' : '→'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@mymindcoach.app')}>
          <Text style={styles.linkText}>{t('contactSupport')}</Text>
          <Text style={styles.linkArrow}>{isRTL ? '←' : '→'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetRow}
          onPress={() => {
            Alert.alert(
              t('confirmResetTitle'),
              t('confirmResetMsg'),
              [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('confirmYes'), style: 'destructive',
                  onPress: async () => {
                    await resetOnboarding();
                    router.replace('/onboarding');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.resetText}>{t('changeCoachCountry')}</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devResetRow}
            onPress={() => {
              Alert.alert(
                '🔄 Reset Messages',
                'Reset your daily message counter to 0?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset', style: 'destructive',
                    onPress: async () => {
                      await resetMessageCount();
                      Alert.alert('✅ Done', 'Message count reset. You have full messages again.');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.devResetText}>⚡ Reset Daily Messages</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('reminderTime')}</Text>
            <FlatList
              data={Array.from({ length: 24 }, (_, i) => i)}
              keyExtractor={item => String(item)}
              renderItem={({ item }) => {
                const label = item === 0 ? '12:00 AM' : item < 12 ? `${item}:00 AM` : item === 12 ? '12:00 PM' : `${item - 12}:00 PM`;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, notifHour === item && styles.modalItemActive]}
                    onPress={() => handleTimeSelect(item)}
                  >
                    <Text style={[styles.modalLangName, notifHour === item && styles.modalLangNameActive]}>{label}</Text>
                    {notifHour === item && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTimeModal(false)}>
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* App Language Modal */}
      <Modal visible={showAppLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('appLanguageLabel')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, appLang === item.code && styles.modalItemActive]}
                  onPress={() => handleAppLang(item.code)}
                >
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <Text style={[styles.modalLangName, appLang === item.code && styles.modalLangNameActive]}>
                    {item.label}
                  </Text>
                  {appLang === item.code && <Text style={styles.modalCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAppLangModal(false)}>
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chat Language Modal */}
      <Modal visible={showChatLangModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('chatLanguageLabel')}</Text>
            <FlatList
              data={CHAT_LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, chatLang === item.code && styles.modalItemActive]}
                  onPress={() => handleChatLang(item.code)}
                >
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <Text style={[styles.modalLangName, chatLang === item.code && styles.modalLangNameActive]}>
                    {item.label}
                  </Text>
                  {chatLang === item.code && <Text style={styles.modalCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowChatLangModal(false)}>
              <Text style={styles.modalCloseText}>{t('cancel')}</Text>
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
    scroll: { padding: 20 },
    title: { fontSize: 26, fontWeight: '700', color: Colors.text, marginBottom: 24, textAlign: isRTL ? 'right' : 'left' },
    premiumCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 16, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.warning },
    premiumCardActive: { borderColor: Colors.success },
    premiumEmoji: { fontSize: 28, marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 },
    premiumTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    premiumDesc: { fontSize: 13, color: Colors.textLight, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    premiumArrow: { fontSize: 18, color: Colors.warning, fontWeight: '700' },
    premiumCheck: { fontSize: 20, color: Colors.success, fontWeight: '700' },
    planBadgeRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    planBadge: { backgroundColor: Colors.success + '25', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    planBadgeText: { fontSize: 11, color: Colors.success, fontWeight: '700' },
    sectionHeader: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1, textAlign: isRTL ? 'right' : 'left' },
    langRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
    langLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    langSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    langValue: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 },
    genderPicker: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
    genderChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
    genderChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    genderChipText: { fontSize: 12, fontWeight: '600', color: Colors.textLight },
    genderChipTextActive: { color: Colors.primary },
    langFlag: { fontSize: 20 },
    langName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    langArrow: { fontSize: 20, color: Colors.textMuted },
    infoCard: {
      backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 16,
      borderLeftWidth: isRTL ? 0 : 4, borderLeftColor: Colors.success,
      borderRightWidth: isRTL ? 4 : 0, borderRightColor: Colors.success,
      borderWidth: 1, borderColor: Colors.border,
    },
    infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' },
    infoText: { fontSize: 13, color: Colors.textLight, lineHeight: 20, textAlign: isRTL ? 'right' : 'left' },
    linkRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
    linkText: { fontSize: 14, fontWeight: '600', color: Colors.text },
    linkArrow: { fontSize: 16, color: Colors.textMuted },
    crisisRow: { borderColor: '#FCA5A5', backgroundColor: Colors.card },
    resetRow: { alignItems: 'center', paddingVertical: 16, marginTop: 4, marginBottom: 8 },
    resetText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
    devResetRow: { alignItems: 'center', paddingVertical: 12, marginBottom: 32 },
    devResetText: { fontSize: 13, fontWeight: '600', color: Colors.primary + 'AA' },
    notifRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
    coachRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
    coachAvatarCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    coachAvatarEmoji: { fontSize: 28 },
    coachName: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: isRTL ? 'right' : 'left' },
    coachSpecialty: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: isRTL ? 'right' : 'left' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16, textAlign: 'center' },
    modalItem: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 6 },
    modalItemActive: { backgroundColor: Colors.primaryLight },
    modalFlag: { fontSize: 24, marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0 },
    modalLangName: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500', textAlign: isRTL ? 'right' : 'left' },
    modalLangNameActive: { color: Colors.primary, fontWeight: '700' },
    modalCheck: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
    modalClose: { marginTop: 12, padding: 16, alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12 },
    modalCloseText: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  });
}
