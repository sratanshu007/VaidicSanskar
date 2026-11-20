import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore, SUBSCRIPTION_PLANS } from '../../services/sahityaStore';

export default function SahityaAudioPaywallScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const book = route?.params?.book;
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('monthly');

  const monthlyPlan = SUBSCRIPTION_PLANS.find((p) => p.id === 'monthly') || SUBSCRIPTION_PLANS[0];

  const handleGoToCheckout = (planId = 'monthly') => {
    navigation.navigate('SahityaCheckout', {
      planId,
      book,
    });
  };

  const handleStartTrial = () => {
    navigation.navigate('SahityaCheckout', {
      planId: 'trial',
      book,
    });
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await sahityaStore.restorePurchases();
      setLoading(false);
      Alert.alert(res.success ? 'सफलता' : 'सूचना', res.message, [
        {
          text: 'ठीक है',
          onPress: () => {
            if (res.success) {
              navigation.replace('SahityaSubscriptionSuccess', { book });
            }
          },
        },
      ]);
    } catch (_) {
      setLoading(false);
      Alert.alert('त्रुटि', 'खरीद बहाल करने में असमर्थ।');
    }
  };

  const handleOpenTerms = () => {
    Alert.alert(
      'नियम एवं शर्तें (Terms & Conditions)',
      '1. सदस्यता अवधि के दौरान सभी धार्मिक ग्रंथ एवं साहित्य असीमित रूप से पठन हेतु उपलब्ध रहेंगे।\n2. आप इसे कभी भी सेटिंग्स से रद्द कर सकते हैं।\n3. मूलभूत आरती व चालीसा पठन हमेशा 100% निःशुल्क रहेगा।'
    );
  };

  const handleOpenPrivacy = () => {
    Alert.alert(
      'गोपनीयता नीति (Privacy Policy)',
      'वैदिक संस्कार आपकी व्यक्तिगत जानकारी और स्वाध्याय विवरण को सुरक्षित रखता है।'
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C0508" translucent={false} />

      {/* TOP CLOSE BUTTON */}
      <View style={[s.headerRow, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 36 }} />
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.closeBtn}
        >
          <Ionicons name="close" size={24} color="#FFF5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SACRED EMBLEM */}
        <View style={s.artworkContainer}>
          <Image
            source={require('../../../assets/sahitya/crown_success.png')}
            style={s.crownImg}
            resizeMode="contain"
          />
        </View>

        {/* HEADLINE */}
        <Text style={s.mainHeadline}>साहित्य संग्रह प्रीमियम सदस्यता</Text>
        <Text style={s.subHeadline}>
          समस्त पवित्र वैदिक ग्रंथों, गीता, उपनिषदों एवं दुर्लभ साहित्यों का सविस्तार पठन करें
        </Text>

        {/* PERKS LIST */}
        <View style={s.perksContainer}>
          <View style={s.perkRow}>
            <View style={s.checkBubble}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={s.perkText}>सभी पवित्र धार्मिक ग्रंथों व साहित्यों का असीमित पठन</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkBubble}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={s.perkText}>विशुद्ध देवनागरी एवं संस्कृत श्लोक संपूर्ण हिंदी अर्थ सहित</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkBubble}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={s.perkText}>शांत, सात्विक एवं विज्ञापन-रहित स्वाध्याय अनुभव</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkBubble}>
              <Ionicons name="checkmark" size={14} color="#FFF" />
            </View>
            <Text style={s.perkText}>ऑफलाइन पठन एवं व्यक्तिगत नोट्स सहेजने की सुविधा</Text>
          </View>
        </View>

        {/* PLAN CARDS */}
        <View style={s.planCardsRow}>
          {SUBSCRIPTION_PLANS.filter((p) => p.id !== 'trial').map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.85}
                style={[s.planCard, isSelected && s.planCardSelected]}
                onPress={() => setSelectedPlanId(plan.id)}
              >
                {plan.badge ? (
                  <View style={s.planBadge}>
                    <Text style={s.planBadgeText}>{plan.badge}</Text>
                  </View>
                ) : null}
                <Text style={s.planTitle}>{plan.name.split(' (')[0]}</Text>
                <Text style={s.planDuration}>{plan.durationLabel}</Text>
                <View style={s.priceRow}>
                  <Text style={s.priceSymbol}>₹</Text>
                  <Text style={s.priceValue}>{plan.price}</Text>
                </View>
                <Text style={s.billingPeriod}>{plan.billingPeriod}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PRIMARY CTA */}
        <TouchableOpacity
          style={s.primaryCta}
          activeOpacity={0.88}
          onPress={() => handleGoToCheckout(selectedPlanId)}
        >
          <Text style={s.primaryCtaText}>
            सदस्यता लें - ₹{SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId)?.price || 99}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#2B0000" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        {/* 7 DAYS FREE TRIAL SECONDARY CTA */}
        <TouchableOpacity style={s.trialBtn} activeOpacity={0.8} onPress={handleStartTrial}>
          <Text style={s.trialBtnText}>7 दिन का निःशुल्क परीक्षण शुरू करें</Text>
        </TouchableOpacity>

        {/* RESTORE PURCHASES */}
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#EADBCE" />
          ) : (
            <Text style={s.restoreText}>पूर्व सदस्यता बहाल करें (Restore Purchase)</Text>
          )}
        </TouchableOpacity>

        {/* TERMS & PRIVACY */}
        <View style={s.legalFooter}>
          <TouchableOpacity onPress={handleOpenTerms}>
            <Text style={s.legalLink}>नियम एवं शर्तें</Text>
          </TouchableOpacity>
          <Text style={s.legalDot}>•</Text>
          <TouchableOpacity onPress={handleOpenPrivacy}>
            <Text style={s.legalLink}>गोपनीयता नीति</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Math.max(insets.bottom, 20) + 10 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#260407',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  artworkContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  crownImg: {
    width: 120,
    height: 120,
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF5E5',
    textAlign: 'center',
    marginTop: 4,
    ...serif,
  },
  subHeadline: {
    fontSize: 14,
    color: '#E0C8AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  perksContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  perkText: {
    fontSize: 14,
    color: '#FFF2DE',
    fontWeight: '600',
    flex: 1,
  },
  planCardsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#D97706',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF2DE',
    marginTop: 6,
    textAlign: 'center',
  },
  planDuration: {
    fontSize: 11,
    color: '#C4B5A5',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  priceSymbol: {
    fontSize: 14,
    color: '#FDE68A',
    fontWeight: '700',
    marginTop: 2,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FDE68A',
  },
  billingPeriod: {
    fontSize: 10,
    color: '#C4B5A5',
    marginTop: 2,
  },
  primaryCta: {
    width: '100%',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B0000',
  },
  trialBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  trialBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE68A',
    textDecorationLine: 'underline',
  },
  restoreBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 12,
    color: '#C4B5A5',
    textAlign: 'center',
  },
  legalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  legalLink: {
    fontSize: 11,
    color: '#9E8E81',
    textDecorationLine: 'underline',
  },
  legalDot: {
    marginHorizontal: 8,
    color: '#9E8E81',
    fontSize: 12,
  },
});
