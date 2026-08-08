import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

const PLAN_ACCENTS: any = {
  STANDARD: '#2563eb',
  PROFESSIONAL: '#7c3aed',
  ENTERPRISE: '#12085c',
  CUSTOM: '#0f766e',
};

export default function BillingScreen() {
  const { session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [trialAvailable, setTrialAvailable] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${session.token}` };

    try {
      const results = await Promise.allSettled([
        fetch(`${API_BASE_URL}/subscriptions/plans`, { headers }),
        fetch(`${API_BASE_URL}/subscriptions/current`, { headers }),
        fetch(`${API_BASE_URL}/subscriptions/payments`, { headers }),
        fetch(`${API_BASE_URL}/subscriptions/trial/eligibility`, { headers }),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        setPlans(await results[0].value.json() || []);
      }
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        setSubscription(await results[1].value.json() || null);
      }
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        setPayments(await results[2].value.json() || []);
      }
      if (results[3].status === 'fulfilled' && results[3].value.ok) {
        const trialData = await results[3].value.json();
        setTrialAvailable(Boolean(trialData?.available));
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active !== false), [plans]);

  const formatLabel = (value: string) => {
    if (!value) return 'Not available';
    return String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (value: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isExpired = subscription?.status === 'EXPIRED';

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={20} color="#1e1b3d" />
          <Text style={{ fontSize: 14, color: '#1e1b3d', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
        <View style={styles.cycleToggle}>
          <TouchableOpacity style={[styles.toggleBtn, billingCycle === 'MONTHLY' && styles.toggleBtnActive]} onPress={() => setBillingCycle('MONTHLY')}>
            <Text style={[styles.toggleText, billingCycle === 'MONTHLY' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, billingCycle === 'YEARLY' && styles.toggleBtnActive]} onPress={() => setBillingCycle('YEARLY')}>
            <Text style={[styles.toggleText, billingCycle === 'YEARLY' && styles.toggleTextActive]}>Yearly (Save)</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.currentCard}>
              <View style={styles.currentHeader}>
                <View style={styles.iconBox}><Ionicons name="shield-checkmark" size={24} color="#3d2e9c" /></View>
                <View style={styles.currentDetails}>
                  <Text style={styles.currentLabel}>Current Plan</Text>
                  <Text style={styles.currentPlanName}>{subscription?.planName || 'No Active Plan'}</Text>
                </View>
              </View>
              
              {subscription && (
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Days Left</Text>
                    <Text style={styles.metricValue}>{subscription.daysRemaining ?? 0}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Status</Text>
                    <Text style={[styles.metricValue, isExpired && { color: '#ef4444' }]}>{formatLabel(subscription.status)}</Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Available Plans</Text>
            <View style={styles.plansGrid}>
              {trialAvailable && (
                <View style={[styles.planCard, { borderColor: '#10b981' }]}>
                  <Text style={[styles.planName, { color: '#10b981' }]}>Free Trial</Text>
                  <Text style={styles.planPrice}>₹0</Text>
                  <Text style={styles.planFeature}>• 2 days of Standard access</Text>
                  <Text style={styles.planFeature}>• 3 active events</Text>
                  <TouchableOpacity style={[styles.planBtn, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.planBtnText}>Start Free Trial</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activePlans.map(plan => {
                const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
                return (
                  <View key={plan.code} style={[styles.planCard, { borderColor: PLAN_ACCENTS[plan.code] || '#7c3aed' }]}>
                    {plan.code === 'PROFESSIONAL' && <View style={styles.badge}><Text style={styles.badgeText}>Popular</Text></View>}
                    <Text style={[styles.planName, { color: PLAN_ACCENTS[plan.code] || '#7c3aed' }]}>{plan.displayName}</Text>
                    <Text style={styles.planPrice}>₹{price} <Text style={styles.planCycle}>/{billingCycle === 'YEARLY' ? 'yr' : 'mo'}</Text></Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                    <Text style={styles.planFeature}>• {plan.maxActiveEvents === -1 ? 'Unlimited' : plan.maxActiveEvents} active events</Text>
                    <Text style={styles.planFeature}>• {plan.maxPortalUsers === -1 ? 'Unlimited' : plan.maxPortalUsers} portal users</Text>
                    <TouchableOpacity style={[styles.planBtn, { backgroundColor: PLAN_ACCENTS[plan.code] || '#7c3aed' }]}>
                      <Text style={styles.planBtnText}>Choose Plan</Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History</Text>
            {payments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={32} color="#9b9aab" />
                <Text style={styles.emptyText}>No development payments yet</Text>
              </View>
            ) : (
              payments.map(payment => (
                <View key={payment.paymentReference} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyRef} numberOfLines={1}>{payment.paymentReference}</Text>
                    <Text style={styles.historyAmount}>₹{payment.amount}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyPlan} numberOfLines={1}>{payment.planName} • {formatLabel(payment.billingCycle)}</Text>
                    <Text style={styles.historyDate}>{formatDate(payment.createdAt)}</Text>
                  </View>
                  <View style={styles.historyStatusBadge}>
                    <Text style={styles.historyStatusText}>{formatLabel(payment.status)}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f7fc' },
  header: { padding: 22, paddingTop: 60, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e1b3d' },
  content: { padding: 22, paddingBottom: 60 },
  cycleToggle: { flexDirection: 'row', backgroundColor: '#ebeaf2', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#3d2e9c' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#68667a' },
  toggleTextActive: { color: '#ffffff' },
  currentCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 30 },
  currentHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#efecff', alignItems: 'center', justifyContent: 'center' },
  currentDetails: { flex: 1 },
  currentLabel: { fontSize: 13, color: '#68667a', fontWeight: '700', textTransform: 'uppercase' },
  currentPlanName: { fontSize: 22, fontWeight: '800', color: '#1e1b3d', marginTop: 2 },
  metricsRow: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: '#f0eef6', paddingTop: 16 },
  metric: { flex: 1 },
  metricLabel: { fontSize: 12, color: '#9b9aab' },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#1e1b3d', marginTop: 4 },
  sectionTitle: { color: '#1e1b3d', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  plansGrid: { gap: 16, marginBottom: 24 },
  planCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 16, borderWidth: 2, position: 'relative' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  planName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  planPrice: { fontSize: 32, fontWeight: '800', color: '#1e1b3d', marginBottom: 8 },
  planCycle: { fontSize: 16, color: '#68667a' },
  planDesc: { fontSize: 14, color: '#68667a', marginBottom: 16 },
  planFeature: { fontSize: 13, color: '#1e1b3d', marginBottom: 6 },
  planBtn: { marginTop: 20, padding: 14, borderRadius: 10, alignItems: 'center' },
  planBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  emptyCard: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eceaf3', borderStyle: 'dashed' },
  emptyText: { marginTop: 12, fontSize: 14, color: '#68667a' },
  historyCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eceaf3', marginBottom: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  historyRef: { fontSize: 14, fontWeight: '700', color: '#1e1b3d', flex: 1, marginRight: 8 },
  historyAmount: { fontSize: 14, fontWeight: '800', color: '#1e1b3d', flexShrink: 0 },
  historyPlan: { fontSize: 13, color: '#68667a', flex: 1, marginRight: 8 },
  historyDate: { fontSize: 12, color: '#9b9aab', flexShrink: 0 },
  historyStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f0eef6', borderRadius: 4, marginTop: 4 },
  historyStatusText: { fontSize: 11, fontWeight: '700', color: '#68667a', textTransform: 'uppercase' },
});
