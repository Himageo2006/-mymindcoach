import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';
import { getOfferings, purchasePremium, restorePurchases } from '../src/services/subscription';

const FEATURES = [
  { icon: '💬', text: '300–500 AI messages per day' },
  { icon: '📝', text: 'Unlimited journal entries' },
  { icon: '📊', text: '90-day mood history & insights' },
  { icon: '🎤', text: 'Voice messages' },
  { icon: '🌍', text: '30+ coaches in multiple languages' },
  { icon: '🧠', text: 'Claude Sonnet — smarter responses' },
];

const FALLBACK_PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$12.99',
    period: '/month',
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '$59.99',
    period: '/year',
    badge: 'Save 62%',
  },
];

export default function Paywall() {
  const Colors = useColors();
  const [offerings, setOfferings] = useState(null);
  const [selected, setSelected] = useState('annual');
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    getOfferings().then((o) => {
      setOfferings(o);
      setLoading(false);
    });
  }, []);

  const getPackage = useCallback(() => {
    if (!offerings) return null;
    if (selected === 'annual') return offerings.annual || offerings.twoMonth || null;
    return offerings.monthly || null;
  }, [offerings, selected]);

  const handlePurchase = async () => {
    setBuying(true);
    try {
      const pkg = getPackage();
      if (!pkg) {
        Alert.alert('Store not available', 'Please try again later or contact support.');
        return;
      }
      await purchasePremium(pkg);
      router.replace('/(tabs)');
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert('Purchase failed', e.message || 'Please try again.');
      }
    } finally {
      setBuying(false);
    }
  };

  const handleRestore = async () => {
    setBuying(true);
    try {
      const info = await restorePurchases();
      const hasActive = Object.keys(info.entitlements.active || {}).length > 0;
      if (hasActive) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('No purchases found', 'No active subscription was found for this account.');
      }
    } catch (e) {
      Alert.alert('Restore failed', e.message || 'Please try again.');
    } finally {
      setBuying(false);
    }
  };

  const getPriceLabel = (planId) => {
    if (offerings) {
      const pkg = planId === 'annual'
        ? offerings.annual || offerings.twoMonth
        : offerings.monthly;
      if (pkg) return pkg.product.priceString;
    }
    return planId === 'annual' ? '$59.99' : '$12.99';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.crown]}>👑</Text>
          <Text style={[styles.title, { color: Colors.text }]}>Upgrade to Pro</Text>
          <Text style={[styles.subtitle, { color: Colors.textLight }]}>
            Unlock unlimited coaching and smarter AI responses
          </Text>
        </View>

        {/* Plan selector */}
        <View style={[styles.planRow]}>
          {FALLBACK_PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { borderColor: active ? Colors.primary : Colors.border || '#E0E0E0', backgroundColor: active ? Colors.primary + '18' : Colors.card },
                ]}
                onPress={() => setSelected(plan.id)}
                activeOpacity={0.8}
              >
                {plan.badge && (
                  <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, { color: Colors.text }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, { color: active ? Colors.primary : Colors.text }]}>
                  {loading ? '...' : getPriceLabel(plan.id)}
                </Text>
                <Text style={[styles.planPeriod, { color: Colors.textLight }]}>{plan.period}</Text>
                {active && (
                  <View style={[styles.checkDot, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Features */}
        <View style={[styles.featureBox, { backgroundColor: Colors.card }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureText, { color: Colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: Colors.primary, opacity: buying ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={buying || loading}
          activeOpacity={0.85}
        >
          {buying
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaText}>
                {selected === 'annual' ? 'Start Annual Plan' : 'Start Monthly Plan'}
              </Text>
          }
        </TouchableOpacity>

        {/* Legal & restore */}
        <Text style={[styles.legal, { color: Colors.textLight }]}>
          Subscription renews automatically. Cancel anytime in your account settings.
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={buying} style={styles.restoreBtn}>
          <Text style={[styles.restoreText, { color: Colors.primary }]}>Restore Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: Colors.textLight }]}>Maybe later</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll:       { padding: 24, paddingBottom: 40 },
  header:       { alignItems: 'center', marginBottom: 28 },
  crown:        { fontSize: 52, marginBottom: 12 },
  title:        { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  planRow:      { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planCard:     { flex: 1, borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center', position: 'relative' },
  badge:        { position: 'absolute', top: -10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  planLabel:    { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  planPrice:    { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  planPeriod:   { fontSize: 12 },
  checkDot:     { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  featureBox:   { borderRadius: 16, padding: 20, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  featureIcon:  { fontSize: 18, marginRight: 12 },
  featureText:  { fontSize: 14, flex: 1 },
  cta:          { borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 14 },
  ctaText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  legal:        { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  restoreBtn:   { alignItems: 'center', paddingVertical: 8 },
  restoreText:  { fontSize: 14, fontWeight: '600' },
  skipBtn:      { alignItems: 'center', paddingVertical: 12 },
  skipText:     { fontSize: 14 },
});
