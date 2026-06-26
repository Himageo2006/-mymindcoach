import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, ScrollView, Alert, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '../src/context/ThemeContext';
import { getOfferings, purchasePremium, restorePurchases } from '../src/services/subscription';

const FEATURES = [
  { icon: '💬', text: 'Up to 500 coaching messages a day' },
  { icon: '📝', text: 'Unlimited journaling' },
  { icon: '📊', text: '90-day mood history & insights' },
  { icon: '🎤', text: 'Voice messages' },
  { icon: '🌍', text: 'Every coach, in your language' },
  { icon: '⚡', text: 'Priority responses, no daily wall' },
];

// Extract the currency symbol/prefix from a localized price string ("$12.99" -> "$").
function currencyPrefix(priceString = '') {
  const m = priceString.match(/^[^\d]*/);
  return (m && m[0]) ? m[0].trim() : '';
}

// Free-trial length in days from a product's intro offer, or 0 if none.
function trialDays(pkg) {
  const ip = pkg?.product?.introPrice;
  if (!ip || ip.price !== 0) return 0;
  const n = ip.periodNumberOfUnits || 0;
  const unit = ip.periodUnit;
  if (unit === 'WEEK') return n * 7;
  if (unit === 'MONTH') return n * 30;
  if (unit === 'YEAR') return n * 365;
  return n; // DAY
}

export default function Paywall() {
  const Colors = useColors();
  const { goal } = useLocalSearchParams();
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

  const pkgFor = useCallback((planId) => {
    if (!offerings) return null;
    return planId === 'annual'
      ? offerings.annual || offerings.twoMonth || null
      : offerings.monthly || null;
  }, [offerings]);

  const getPackage = useCallback(() => pkgFor(selected), [pkgFor, selected]);

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
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message || 'Please try again.');
    } finally {
      setBuying(false);
    }
  };

  const handleRestore = async () => {
    setBuying(true);
    try {
      const info = await restorePurchases();
      const hasActive = Object.keys(info.entitlements.active || {}).length > 0;
      if (hasActive) router.replace('/(tabs)');
      else Alert.alert('No purchases found', 'No active subscription was found for this account.');
    } catch (e) {
      Alert.alert('Restore failed', e.message || 'Please try again.');
    } finally {
      setBuying(false);
    }
  };

  // ── Derived pricing (live from store, with fallbacks) ────────────────────────
  const annualPkg = pkgFor('annual');
  const monthlyPkg = pkgFor('monthly');
  const annualPrice = annualPkg?.product?.price ?? 59.99;
  const monthlyPrice = monthlyPkg?.product?.price ?? 12.99;
  const sym = currencyPrefix(annualPkg?.product?.priceString || monthlyPkg?.product?.priceString || '$');

  const priceLabel = (planId) => {
    const pkg = pkgFor(planId);
    if (pkg) return pkg.product.priceString;
    return planId === 'annual' ? '$59.99' : '$12.99';
  };
  // Annual shown as a per-month figure — the anchor that lifts conversions.
  const annualPerMonth = `${sym}${(annualPrice / 12).toFixed(2)}/mo`;
  const savingsPct = monthlyPrice > 0
    ? Math.max(0, Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100))
    : 0;

  const selectedPkg = getPackage();
  const days = trialDays(selectedPkg);
  const headline = goal
    ? `Keep working through ${goal} with your coach`
    : 'Unlimited coaching, whenever you need it';
  const subtitle = days
    ? `Try Pro free for ${days} days — cancel anytime.`
    : 'Unlock unlimited messages and every coach.';
  const ctaText = days
    ? `Start my ${days}-day free trial`
    : (selected === 'annual' ? 'Start annual plan' : 'Start monthly plan');
  const legal = days
    ? `${days}-day free trial, then ${priceLabel(selected)}${selected === 'annual' ? '/year' : '/month'}. Cancel anytime in your account settings — no charge until the trial ends.`
    : 'Subscription renews automatically. Cancel anytime in your account settings.';

  const PLANS = [
    { id: 'monthly', label: 'Monthly', sub: 'billed monthly', badge: null },
    { id: 'annual', label: 'Annual', sub: `${annualPerMonth} · billed yearly`, badge: savingsPct ? `Save ${savingsPct}%` : 'Best value' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={[styles.title, { color: Colors.text }]}>{headline}</Text>
          <Text style={[styles.subtitle, { color: Colors.textLight }]}>{subtitle}</Text>
        </View>

        <View style={styles.planRow}>
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, {
                  borderColor: active ? Colors.primary : Colors.border || '#E0E0E0',
                  backgroundColor: active ? Colors.primary + '18' : Colors.card,
                }]}
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
                  {loading ? '...' : priceLabel(plan.id)}
                </Text>
                <Text style={[styles.planPeriod, { color: Colors.textLight }]}>{plan.sub}</Text>
                {active && (
                  <View style={[styles.checkDot, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.featureBox, { backgroundColor: Colors.card }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureText, { color: Colors.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: Colors.primary, opacity: buying ? 0.7 : 1 }]}
          onPress={handlePurchase}
          disabled={buying || loading}
          activeOpacity={0.85}
        >
          {buying ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{ctaText}</Text>}
        </TouchableOpacity>

        <Text style={[styles.legal, { color: Colors.textLight }]}>{legal}</Text>

        {/* Apple 3.1.2(c): functional Terms of Use (EULA) + Privacy Policy links required in the purchase flow */}
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={[styles.linkText, { color: Colors.primary }]}>Terms of Use (EULA)</Text>
          </TouchableOpacity>
          <Text style={[styles.linkSep, { color: Colors.textLight }]}>·</Text>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={[styles.linkText, { color: Colors.primary }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

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
  title:        { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  planRow:      { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planCard:     { flex: 1, borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center', position: 'relative' },
  badge:        { position: 'absolute', top: -10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  planLabel:    { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  planPrice:    { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  planPeriod:   { fontSize: 11, textAlign: 'center' },
  checkDot:     { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
  featureBox:   { borderRadius: 16, padding: 20, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  featureIcon:  { fontSize: 18, marginRight: 12 },
  featureText:  { fontSize: 14, flex: 1 },
  cta:          { borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 14 },
  ctaText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  legal:        { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  linksRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
  linkText:     { fontSize: 12, fontWeight: '600' },
  linkSep:      { fontSize: 12 },
  restoreBtn:   { alignItems: 'center', paddingVertical: 8 },
  restoreText:  { fontSize: 14, fontWeight: '600' },
  skipBtn:      { alignItems: 'center', paddingVertical: 12 },
  skipText:     { fontSize: 14 },
});
