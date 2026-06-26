import { useEffect, useRef, useState, Component } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../src/i18n';
import { initLanguage } from '../src/services/language';
import { initRevenueCat } from '../src/services/subscription';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { LightColors } from '../src/constants/colors';

const PRIMARY = LightColors.primary;

// ─── Global error boundary ────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 24, paddingTop: 80, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 24 }}>😔</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
            The app ran into an unexpected problem. Please close and reopen the app.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: '#7C3AED', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Splash screen (shown while AsyncStorage loads) ───────────────────────────
function SplashScreen() {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(subtitleFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={splash.container}>
      <View style={splash.bgCircle1} />
      <View style={splash.bgCircle2} />
      <Animated.View style={[splash.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[splash.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={splash.logoEmoji}>🧠</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={splash.appName}>MyMindCoach</Text>
      </Animated.View>
      <Animated.View style={{ opacity: subtitleFade }}>
        <Text style={splash.tagline}>Your mental wellness companion</Text>
      </Animated.View>
      <Animated.View style={[splash.dotsRow, { opacity: subtitleFade }]}>
        <View style={[splash.dot, splash.dotActive]} />
        <View style={splash.dot} />
        <View style={splash.dot} />
      </Animated.View>
    </View>
  );
}

const splash = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  bgCircle1: { position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.07)' },
  bgCircle2: { position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(236,72,153,0.25)' },
  logoWrap:   { marginBottom: 24 },
  logoCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  logoEmoji:  { fontSize: 58 },
  appName:    { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 10 },
  tagline:    { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500', letterSpacing: 0.3 },
  dotsRow:    { flexDirection: 'row', gap: 8, marginTop: 48 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive:  { backgroundColor: '#fff', width: 24 },
});

// ─── AI Data Consent Modal ────────────────────────────────────────────────────
function AIConsentModal({ visible, onAccept }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={consent.overlay}>
        <View style={consent.card}>
          <Text style={consent.emoji}>🔒</Text>
          <Text style={consent.title}>Your Privacy Matters</Text>
          <ScrollView style={consent.scroll} showsVerticalScrollIndicator={false}>
            <Text style={consent.body}>
              MyMindCoach uses AI to provide personalized mental wellness support. To do this, the messages and journal entries you share with your coach are sent to{' '}
              <Text style={consent.bold}>Anthropic's Claude AI</Text>
              {' '}for processing.
            </Text>
            <Text style={consent.sectionTitle}>What data is shared:</Text>
            <Text style={consent.bullet}>• Your chat messages with AI coaches</Text>
            <Text style={consent.bullet}>• Journal entries you submit for analysis</Text>
            <Text style={consent.bullet}>• Mood check-in responses</Text>
            <Text style={consent.sectionTitle}>Who receives your data:</Text>
            <Text style={consent.bullet}>• <Text style={consent.bold}>Anthropic, Inc.</Text> — AI processing only</Text>
            <Text style={consent.bullet}>• Data is not sold or used for advertising</Text>
            <Text style={consent.body}>
              Anthropic processes data under their{' '}
              <Text
                style={consent.link}
                onPress={() => Linking.openURL('https://www.anthropic.com/privacy')}
              >
                Privacy Policy
              </Text>
              . You can review our full privacy policy at any time in Settings.
            </Text>
          </ScrollView>
          <TouchableOpacity style={consent.acceptBtn} onPress={onAccept}>
            <Text style={consent.acceptText}>I Understand & Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const consent = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxHeight: '80%' },
  emoji:       { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  title:       { fontSize: 22, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 16 },
  scroll:      { maxHeight: 320 },
  body:        { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginTop: 8, marginBottom: 4 },
  bullet:      { fontSize: 14, color: '#555', lineHeight: 22, marginLeft: 4, marginBottom: 2 },
  bold:        { fontWeight: '700', color: '#1a1a2e' },
  link:        { color: '#7C3AED', textDecorationLine: 'underline' },
  acceptBtn:   { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  acceptText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// ─── The real app stack (only mounts after we know where to go) ───────────────
function AppStack({ onboarded }) {
  const { isDark } = useTheme();

  useEffect(() => {
    // By the time AppStack mounts the navigator is 100% ready.
    // Navigate away from the blank index immediately.
    const dest = onboarded ? '/(tabs)' : '/onboarding';
    router.replace(dest);
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="crisis" />
        <Stack.Screen name="breathing" />
      </Stack>
    </>
  );
}

// ─── Root layout: shows splash → then mounts AppStack ────────────────────────
export default function RootLayout() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'onboarded' | 'new'
  const [consentGiven, setConsentGiven] = useState(true); // true until we know otherwise

  useEffect(() => {
    initLanguage().catch(() => {});
    initRevenueCat().catch(() => {});
    // Re-arm re-engagement notifications on every app open (no-op if disabled)
    import('../src/services/language')
      .then(({ getAppLanguage }) => getAppLanguage())
      .then((lang) => import('../src/services/notifications').then(({ refreshEngagement }) => refreshEngagement(lang || 'en')))
      .catch(() => {});

    const startMs = Date.now();

    Promise.all([
      AsyncStorage.getItem('onboarded').catch(() => null),
      AsyncStorage.getItem('ai_consent_given').catch(() => null),
    ]).then(([onboardedVal, consentVal]) => {
      const dest = onboardedVal === 'true' ? 'onboarded' : 'new';
      const elapsed = Date.now() - startMs;
      const minWait = 2000;
      setTimeout(() => {
        setConsentGiven(consentVal === 'true');
        setStatus(dest);
      }, Math.max(0, minWait - elapsed));
    });
  }, []);

  const handleAcceptConsent = async () => {
    await AsyncStorage.setItem('ai_consent_given', 'true');
    setConsentGiven(true);
  };

  // While loading: pure View splash — no navigator mounted yet, zero race conditions
  if (status === 'loading') {
    return (
      <ErrorBoundary>
        <SplashScreen />
      </ErrorBoundary>
    );
  }

  // After loading: mount the navigator. router.replace() fires from AppStack's
  // useEffect, which runs AFTER the navigator is committed to the screen.
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppStack onboarded={status === 'onboarded'} />
        <AIConsentModal visible={!consentGiven} onAccept={handleAcceptConsent} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
