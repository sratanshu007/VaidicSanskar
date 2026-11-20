import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore, SUBSCRIPTION_PLANS } from '../../services/sahityaStore';

export default function SahityaSubscriptionSuccessScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const book = route?.params?.book;
  const sub = sahityaStore.subscription;

  const activePlan =
    route?.params?.plan ||
    SUBSCRIPTION_PLANS.find((p) => p.id === sub.plan) ||
    SUBSCRIPTION_PLANS[0];

  const handleStartReading = () => {
    if (book) {
      navigation.replace('SahityaFreeReader', { book });
    } else {
      navigation.navigate('SahityaHome');
    }
  };

  const handleDone = () => {
    navigation.navigate('SahityaHome');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '18 नव॰ 2026';
    const d = new Date(dateStr);
    return d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF5E5" translucent={false} />

      {/* TOP CLOSE / BACK */}
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={handleDone}
          style={s.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color={th.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* CELEBRATION EMBLEM */}
        <View style={s.emblemWrapper}>
          <Image
            source={require('../../../assets/sahitya/crown_success.png')}
            style={s.crownImage}
            resizeMode="contain"
          />
        </View>

        {/* HEADINGS */}
        <Text style={s.successTitle}>बधाई हो!</Text>
        <Text style={s.successSub}>
          आपकी प्रीमियम सदस्यता सफलतापूर्वक सक्रिय हो गई है।
        </Text>

        {/* ACTIVE PLAN CARD */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>सक्रिय योजना</Text>
            <View style={s.planBadge}>
              <MaterialCommunityIcons name="crown" size={14} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={s.planBadgeText}>{activePlan.name}</Text>
            </View>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>सक्रियता तिथि</Text>
            <Text style={s.summaryValue}>{formatDate(sub.activatedAt)}</Text>
          </View>

          <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={s.summaryLabel}>अगला नवीनीकरण</Text>
            <Text style={[s.summaryValue, { color: th.primary }]}>{formatDate(sub.expiresAt)}</Text>
          </View>
        </View>

        {/* PERKS LIST (READING-ONLY) */}
        <View style={s.perksContainer}>
          <View style={s.perkRow}>
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <Text style={s.perkText}>अब आप सभी धार्मिक साहित्यों एवं ग्रंथों का सम्पूर्ण पठन कर सकते हैं</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <Text style={s.perkText}>बिना किसी रुकावट के शांत एवं सात्विक स्वाध्याय</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <Text style={s.perkText}>ऑफ़लाइन मोड में पुस्तकें व श्लोक सहेजें</Text>
          </View>

          <View style={s.perkRow}>
            <View style={s.checkCircle}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
            <Text style={s.perkText}>असीमित पठन एक्सेस 24×7 उपलब्ध</Text>
          </View>
        </View>

        {/* PRIMARY ACTION BUTTON */}
        <TouchableOpacity
          style={s.listenButton}
          activeOpacity={0.88}
          onPress={handleStartReading}
        >
          <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={s.listenButtonText}>पढ़ना शुरू करें (Start Reading)</Text>
        </TouchableOpacity>

        {/* SECONDARY BACK TO HOME BUTTON */}
        <TouchableOpacity
          style={s.homeButton}
          activeOpacity={0.8}
          onPress={handleDone}
        >
          <Text style={s.homeButtonText}>गृह पृष्ठ पर जाएं (Home)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9EE',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7E7CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emblemWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  crownImage: {
    width: 120,
    height: 120,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: th.primary,
    textAlign: 'center',
    marginBottom: 6,
    ...serif,
  },
  successSub: {
    fontSize: 15,
    color: '#605040',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE1',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#7C6C5E',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2E1308',
    fontWeight: '700',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  perksContainer: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginBottom: 24,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkCircle: {
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
    color: '#3B291A',
    fontWeight: '600',
    flex: 1,
  },
  listenButton: {
    width: '100%',
    backgroundColor: th.primary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: th.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  listenButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeButton: {
    width: '100%',
    backgroundColor: '#FFF5E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#605040',
  },
});
