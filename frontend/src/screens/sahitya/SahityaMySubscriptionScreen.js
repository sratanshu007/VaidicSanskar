import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore, SUBSCRIPTION_PLANS } from '../../services/sahityaStore';

export default function SahityaMySubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [sub, setSub] = useState(sahityaStore.subscription);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const unsub = sahityaStore.subscribe(() => {
      setSub({ ...sahityaStore.subscription });
    });
    return unsub;
  }, []);

  const isPremium = sahityaStore.isPremiumUser();
  const activePlan = SUBSCRIPTION_PLANS.find((p) => p.id === sub.plan) || SUBSCRIPTION_PLANS[0];

  const handleCancelSubscription = () => {
    Alert.alert(
      'सदस्यता रद्दीकरण (Cancel Subscription)',
      'क्या आप वाकई सदस्यता रद्द करना चाहते हैं? रद्दीकरण के बाद भी आप समाप्ति तिथि तक सभी ऑडियोबुक्स सुन सकेंगे।',
      [
        { text: 'वापस जाएं', style: 'cancel' },
        {
          text: 'रद्द करें',
          style: 'destructive',
          onPress: () => {
            sahityaStore.cancelSubscription();
            Alert.alert(
              'सदस्यता रद्द की गई',
              'ऑटो-रिन्यूअल बंद कर दिया गया है। आपका एक्सेस मौजूदा बिलिंग अवधि के अंत तक सक्रिय रहेगा।'
            );
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const res = await sahityaStore.restorePurchases();
      setIsRestoring(false);
      Alert.alert(res.success ? 'सफलता' : 'सूचना', res.message);
    } catch (_) {
      setIsRestoring(false);
      Alert.alert('त्रुटि', 'खरीद बहाल करने में असमर्थ।');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('hi-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (_) {
      return isoStr;
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5E5" translucent={false} />

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={th.primary} />
        </TouchableOpacity>

        <Text style={s.headerTitle}>मेरी सदस्यता (Subscription)</Text>

        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* MEMBERSHIP STATUS CARD */}
        <View style={s.statusCard}>
          <View style={s.statusIconCircle}>
            <MaterialCommunityIcons
              name={isPremium ? 'crown' : 'book-open-variant'}
              size={36}
              color={isPremium ? th.saffron : th.secondaryText}
            />
          </View>

          <Text style={s.statusHeading}>
            {isPremium ? '👑 प्रीमियम सक्रिय (Active)' : 'निःशुल्क पाठक (Free Reader)'}
          </Text>
          <Text style={s.statusSub}>
            {isPremium
              ? `${activePlan.name} • असीमित ऑडियोबुक्स अनलॉक`
              : 'सभी पुस्तकें निःशुल्क पढ़ें। ऑडियो सुनने हेतु अपग्रेड करें।'}
          </Text>

          {isPremium ? (
            <View style={s.activeBadge}>
              <Text style={s.activeBadgeText}>
                {sub.status === 'PREMIUM_CANCELLED' ? 'रद्द (सक्रिय तिथि तक)' : 'सक्रिय (Active)'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={s.upgradeBtn}
              onPress={() => navigation.navigate('SahityaAudioPaywall')}
            >
              <Text style={s.upgradeBtnText}>प्रीमियम योजना चुनें 👑</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* DETAILS SECTION */}
        {isPremium && (
          <View style={s.detailsCard}>
            <Text style={s.detailsTitle}>सदस्यता विवरण</Text>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>वर्तमान योजना</Text>
              <Text style={s.detailVal}>{activePlan.name}</Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>सक्रियता तिथि</Text>
              <Text style={s.detailVal}>{formatDate(sub.activatedAt)}</Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>समाप्ति / नवीनीकरण तिथि</Text>
              <Text style={s.detailVal}>{formatDate(sub.expiresAt)}</Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>ऑटो-नवीनीकरण (Auto-renew)</Text>
              <Text
                style={[
                  s.detailVal,
                  { color: sub.autoRenew ? th.success : '#B91C1C', fontWeight: '800' },
                ]}
              >
                {sub.autoRenew ? 'चालू (On)' : 'बंद (Off)'}
              </Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailLabel}>भुगतान माध्यम</Text>
              <Text style={s.detailVal}>{sub.provider || 'UPI / Play Billing'}</Text>
            </View>
          </View>
        )}

        {/* ACTIONS LIST */}
        <View style={s.actionsCard}>
          <TouchableOpacity
            style={s.actionItem}
            onPress={() => navigation.navigate('SahityaOrders')}
          >
            <View style={s.actionIconBox}>
              <MaterialCommunityIcons name="receipt-text-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.actionText}>भुगतान एवं ऑर्डर इतिहास</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionItem}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            <View style={s.actionIconBox}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={th.primary} />
              ) : (
                <Ionicons name="refresh-outline" size={20} color={th.primary} />
              )}
            </View>
            <Text style={s.actionText}>खरीद पुनः बहाल करें (Restore Purchases)</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {isPremium && sub.autoRenew && (
            <TouchableOpacity
              style={[s.actionItem, { borderBottomWidth: 0 }]}
              onPress={handleCancelSubscription}
            >
              <View style={[s.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle-outline" size={20} color="#B91C1C" />
              </View>
              <Text style={[s.actionText, { color: '#B91C1C' }]}>सदस्यता रद्द करें</Text>
              <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
            </TouchableOpacity>
          )}
        </View>

        {/* POLICY LINKS */}
        <View style={s.policyBox}>
          <Text style={s.policyText}>
            नियम एवं शर्तें • गोपनीयता नीति • गूगल प्ले / एप्पल सदस्यता दिशा-निर्देश
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF5E5',
    borderBottomWidth: 1,
    borderBottomColor: th.border,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: th.saffron,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 18,
  },
  statusIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: th.saffron,
  },
  statusHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  statusSub: {
    fontSize: 13,
    color: th.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 12,
  },
  activeBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  upgradeBtn: {
    backgroundColor: th.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  upgradeBtnText: {
    color: '#FFF5E5',
    fontSize: 13.5,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: th.border,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7D3',
  },
  detailLabel: {
    fontSize: 13,
    color: th.secondaryText,
  },
  detailVal: {
    fontSize: 13.5,
    color: th.text,
    fontWeight: '700',
  },
  actionsCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: th.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7D3',
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: th.text,
    flex: 1,
  },
  policyBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  policyText: {
    fontSize: 11,
    color: '#8C7D73',
    textAlign: 'center',
  },
});
