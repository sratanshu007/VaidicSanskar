import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore, SUBSCRIPTION_PLANS } from '../../services/sahityaStore';

export default function SahityaCheckoutScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const selectedPlanId = route?.params?.planId || 'monthly';
  const book = route?.params?.book || sahityaStore.getPlayerState().currentBook;

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

  const defaultPaymentMethod = Platform.OS === 'android' ? 'Google Play Billing' : 'Apple In-App Purchase';
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentOptions = [
    {
      id: Platform.OS === 'android' ? 'Google Play Billing' : 'Apple In-App Purchase',
      title: Platform.OS === 'android' ? 'Google Play Billing' : 'Apple In-App Purchase',
      subtitle: 'सुरक्षित डिजिटल सदस्यता (Official In-App Purchase)',
      icon: Platform.OS === 'android' ? 'logo-google-playstore' : 'logo-apple',
      type: 'official',
    },
    {
      id: 'UPI (GPay / PhonePe / Paytm)',
      title: 'UPI (Google Pay, PhonePe, Paytm)',
      subtitle: 'त्वरित एवं शून्य शुल्क भुगतान',
      icon: 'qr-code-outline',
      type: 'upi',
    },
    {
      id: 'Credit / Debit Card',
      title: 'क्रेडिट / डेबिट कार्ड (Visa, RuPay, Master)',
      subtitle: 'ऑटो-रिन्यूअल सुविधा उपलब्ध',
      icon: 'card-outline',
      type: 'card',
    },
  ];

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);
    try {
      // 1. Initiate Purchase Order
      const order = await sahityaStore.initiatePurchase(plan.id, paymentMethod);

      // 2. Simulate Payment & Backend Receipt Verification
      const verifiedOrder = await sahityaStore.verifyAndActivatePurchase(
        order,
        `RECEIPT_TOKEN_${Platform.OS.toUpperCase()}_${Date.now()}`
      );

      setIsProcessing(false);

      // 3. Navigate to Payment Success Screen with Book & Order Details
      navigation.replace('SahityaSubscriptionSuccess', {
        book,
        order: verifiedOrder,
        plan,
      });
    } catch (err) {
      setIsProcessing(false);
      Alert.alert(
        'भुगतान विफल',
        'भुगतान की पुष्टि नहीं हो सकी। कृपया पुनः प्रयास करें अथवा दूसरा भुगतान विकल्प चुनें।',
        [{ text: 'ठीक है' }]
      );
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

        <Text style={s.headerTitle}>सदस्यता चेकआउट</Text>

        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SELECTED PLAN CARD */}
        <View style={s.planSummaryCard}>
          <View style={s.planHeader}>
            <View>
              <Text style={s.planName}>{plan.name}</Text>
              <Text style={s.planDuration}>{plan.billingPeriod} • ऑटो-रिन्यूअल</Text>
            </View>
            <View style={s.priceBadge}>
              <Text style={s.priceText}>
                {plan.currency}
                {plan.price}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          {/* PERKS BULLETS */}
          {plan.features.slice(0, 3).map((feat, idx) => (
            <View key={idx} style={s.featRow}>
              <Ionicons name="checkmark-circle" size={16} color={th.success} />
              <Text style={s.featText}>{feat}</Text>
            </View>
          ))}
        </View>

        {/* PAYMENT METHOD SELECTION */}
        <Text style={s.sectionTitle}>भुगतान विधि चुनें</Text>
        <View style={s.paymentOptionsList}>
          {paymentOptions.map((opt) => {
            const isSelected = paymentMethod === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.paymentOptionCard, isSelected && s.paymentOptionCardActive]}
                onPress={() => setPaymentMethod(opt.id)}
                activeOpacity={0.8}
              >
                <View style={s.paymentIconBox}>
                  <Ionicons name={opt.icon} size={22} color={isSelected ? th.primary : th.secondaryText} />
                </View>

                <View style={s.paymentInfo}>
                  <Text style={[s.paymentTitle, isSelected && s.paymentTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={s.paymentSub}>{opt.subtitle}</Text>
                </View>

                <View style={[s.radioCircle, isSelected && s.radioCircleActive]}>
                  {isSelected && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BILLING BREAKDOWN */}
        <Text style={s.sectionTitle}>मूल्य विवरण (Order Summary)</Text>
        <View style={s.billingCard}>
          <View style={s.billRow}>
            <Text style={s.billLabel}>मूल सदस्यता शुल्क</Text>
            <Text style={s.billValue}>
              {plan.currency}
              {plan.basePrice.toFixed(2)}
            </Text>
          </View>

          <View style={s.billRow}>
            <Text style={s.billLabel}>लागू जीएसटी (GST 18%)</Text>
            <Text style={s.billValue}>
              {plan.currency}
              {plan.taxAmount.toFixed(2)}
            </Text>
          </View>

          <View style={s.divider} />

          <View style={s.billRow}>
            <Text style={s.totalLabel}>कुल देय राशि (Total Payable)</Text>
            <Text style={s.totalValue}>
              {plan.currency}
              {plan.price}
            </Text>
          </View>
        </View>

        {/* CANCELLATION & TRUST NOTE */}
        <View style={s.trustNotice}>
          <MaterialCommunityIcons name="shield-check" size={20} color={th.success} />
          <Text style={s.trustText}>
            256-बिट सुरक्षित भुगतान। आप सदस्यता को सेटिंग्स से कभी भी आसानी से रद्द कर सकते हैं।
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM CONFIRM BAR */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={s.bottomPriceBox}>
          <Text style={s.bottomPriceLabel}>देय राशि</Text>
          <Text style={s.bottomPriceVal}>
            {plan.currency}
            {plan.price}
          </Text>
        </View>

        <TouchableOpacity
          style={s.confirmBtn}
          onPress={handleConfirmPurchase}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF5E5" />
          ) : (
            <>
              <Text style={s.confirmBtnText}>भुगतान करें एवं अनलॉक करें</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF5E5" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  planSummaryCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: th.saffron,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: th.primary,
    fontFamily: serif,
  },
  planDuration: {
    fontSize: 12.5,
    color: th.secondaryText,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: th.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  priceText: {
    color: '#FFF5E5',
    fontSize: 17,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E7D3',
    marginVertical: 12,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featText: {
    fontSize: 13,
    color: th.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
    marginBottom: 10,
    marginTop: 6,
  },
  paymentOptionsList: {
    marginBottom: 20,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFAF1',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: th.border,
    marginBottom: 10,
  },
  paymentOptionCardActive: {
    borderColor: th.primary,
    borderWidth: 2,
    backgroundColor: '#FFF0DE',
  },
  paymentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(233, 161, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: th.text,
  },
  paymentTitleActive: {
    color: th.primary,
  },
  paymentSub: {
    fontSize: 11.5,
    color: th.secondaryText,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BFAAA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: th.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: th.primary,
  },
  billingCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: th.border,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13.5,
    color: th.secondaryText,
  },
  billValue: {
    fontSize: 13.5,
    color: th.text,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: th.primary,
  },
  trustNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 133, 75, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 133, 75, 0.3)',
  },
  trustText: {
    fontSize: 11.5,
    color: '#285E35',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: th.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceBox: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: th.secondaryText,
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: th.primary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
    shadowColor: th.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFF5E5',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
