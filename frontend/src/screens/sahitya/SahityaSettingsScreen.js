import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore } from '../../services/sahityaStore';

export default function SahityaSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(sahityaStore.user);
  const [isPremium, setIsPremium] = useState(sahityaStore.isPremiumUser());
  const [notifications, setNotifications] = useState(user.notificationsEnabled ?? true);
  const [languageModal, setLanguageModal] = useState(false);
  const [fontModal, setFontModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState(user.language || 'हिन्दी');
  const [fontSize, setFontSize] = useState(user.fontSize || 18);

  useEffect(() => {
    const unsub = sahityaStore.subscribe(() => {
      setUser({ ...sahityaStore.user });
      setIsPremium(sahityaStore.isPremiumUser());
    });
    return unsub;
  }, []);

  const handleToggleNotifications = (val) => {
    setNotifications(val);
    sahityaStore.user.notificationsEnabled = val;
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    sahityaStore.user.language = lang;
    setLanguageModal(false);
    Alert.alert('भाषा परिवर्तित', `भाषा अब ${lang} पर सेट है।`);
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    sahityaStore.user.fontSize = size;
    setFontModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'लॉग आउट',
      'क्या आप वाकई लॉग आउट करना चाहते हैं?',
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'लॉग आउट करें',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'ऑफ़लाइन डाउनलोड',
      'क्या आप सभी ऑफ़लाइन सहेजे गए ऑडियो और पुस्तकें हटाना चाहते हैं?',
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हटाएं',
          style: 'destructive',
          onPress: () => Alert.alert('सफलता', 'ऑफ़लाइन कैश साफ़ कर दिया गया है।'),
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={th.bg} translucent={false} />

      {/* TOP HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={th.primary} />
        </TouchableOpacity>

        <Text style={s.headerTitle}>सेटिंग्स</Text>

        <View style={s.headerBtn}>
          <Ionicons name="settings-outline" size={22} color={th.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* USER PROFILE CARD */}
        <View style={s.profileCard}>
          <View style={s.profileAvatar}>
            <Text style={s.avatarInitials}>
              {user.name ? user.name.slice(0, 1) : 'स'}
            </Text>
          </View>

          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user.name || 'सार्थक शर्मा'}</Text>
            <Text style={s.profileEmail}>{user.email || 'sarthak@email.com'}</Text>

            {isPremium ? (
              <View style={s.premiumBadge}>
                <MaterialCommunityIcons name="crown" size={14} color="#D97706" />
                <Text style={s.premiumBadgeText}>प्रीमियम सदस्य</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.freeUpgradeBadge}
                onPress={() => navigation.navigate('SahityaAudioPaywall')}
              >
                <Text style={s.freeBadgeText}>फ्री पाठक • </Text>
                <Text style={s.upgradeText}>प्रीमियम लें 👑</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SETTINGS MENU LIST */}
        <View style={s.menuSection}>
          {/* Subscription Management */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => navigation.navigate('SahityaMySubscription')}
          >
            <View style={s.menuIconBox}>
              <MaterialCommunityIcons name="crown-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>मेरी सदस्यता (My Subscription)</Text>
            <Text style={s.menuValue}>{isPremium ? 'सक्रिय' : 'निःशुल्क'}</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* Orders / Purchase History */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => navigation.navigate('SahityaOrders')}
          >
            <View style={s.menuIconBox}>
              <MaterialCommunityIcons name="receipt-text-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>खरीद एवं ऑर्डर इतिहास</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity style={s.menuItem} onPress={() => setLanguageModal(true)}>
            <View style={s.menuIconBox}>
              <Ionicons name="globe-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>भाषा चुनें</Text>
            <Text style={s.menuValue}>{selectedLang}</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* Notifications */}
          <View style={s.menuItem}>
            <View style={s.menuIconBox}>
              <Ionicons name="notifications-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>सूचना सेटिंग्स</Text>
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#E2D3C4', true: th.primary }}
              thumbColor={notifications ? th.saffron : '#FFFFFF'}
            />
          </View>

          {/* Font Size */}
          <TouchableOpacity style={s.menuItem} onPress={() => setFontModal(true)}>
            <View style={s.menuIconBox}>
              <MaterialCommunityIcons name="format-size" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>पढ़ने का फ़ॉन्ट आकार</Text>
            <Text style={s.menuValue}>{fontSize}px</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* Offline Downloads */}
          <TouchableOpacity style={s.menuItem} onPress={handleClearDownloads}>
            <View style={s.menuIconBox}>
              <Ionicons name="download-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>ऑफ़लाइन डाउनलोड</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* Help & Support */}
          <TouchableOpacity
            style={s.menuItem}
            onPress={() =>
              Alert.alert(
                'सहायता एवं सुझाव',
                'हमसे संपर्क करें: support@vaidicsanskar.in\nफोन: +91 98765 43210'
              )
            }
          >
            <View style={s.menuIconBox}>
              <Ionicons name="help-circle-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>सहायता एवं सुझाव</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>

          {/* About Us */}
          <TouchableOpacity
            style={[s.menuItem, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert(
                'साहित्य संग्रह के बारे में',
                'साहित्य संग्रह — भारत का प्रामाणिक डिजिटल साहित्य एवं आध्यात्मिक पुस्तकालय।\nसंस्करण: 2.1.0\nवैदिक संस्कार'
              )
            }
          >
            <View style={s.menuIconBox}>
              <Ionicons name="information-circle-outline" size={20} color={th.primary} />
            </View>
            <Text style={s.menuLabel}>हमारे बारे में</Text>
            <Ionicons name="chevron-forward" size={18} color="#BFAAA0" />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>लॉग आउट</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* LANGUAGE MODAL */}
      <Modal visible={languageModal} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModal(false)}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>भाषा चुनें</Text>
            {['हिन्दी', 'English', 'संस्कृत'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[s.modalOption, selectedLang === lang && s.modalOptionActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={[s.modalOptionText, selectedLang === lang && s.modalOptionTextActive]}>
                  {lang}
                </Text>
                {selectedLang === lang && (
                  <Ionicons name="checkmark-circle" size={20} color={th.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FONT SIZE MODAL */}
      <Modal visible={fontModal} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setFontModal(false)}
        >
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>फ़ॉन्ट आकार चुनें</Text>
            {[
              { label: 'छोटा (14px)', size: 14 },
              { label: 'सामान्य (18px)', size: 18 },
              { label: 'बड़ा (22px)', size: 22 },
              { label: 'अति बड़ा (26px)', size: 26 },
            ].map((f) => (
              <TouchableOpacity
                key={f.size}
                style={[s.modalOption, fontSize === f.size && s.modalOptionActive]}
                onPress={() => handleFontSizeChange(f.size)}
              >
                <Text style={[s.modalOptionText, fontSize === f.size && s.modalOptionTextActive]}>
                  {f.label}
                </Text>
                {fontSize === f.size && (
                  <Ionicons name="checkmark-circle" size={20} color={th.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={[s.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaHome')}>
          <Ionicons name="home-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>होम</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaMyBooks')}>
          <Ionicons name="book-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>मेरी पुस्तकें</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navTab}
          onPress={() => {
            if (isPremium) {
              navigation.navigate('SahityaSubscriptionSuccess');
            } else {
              navigation.navigate('SahityaAudioPaywall');
            }
          }}
        >
          <MaterialCommunityIcons name="crown-outline" size={22} color={th.saffron} />
          <Text style={[s.navTabText, { color: th.saffron, fontWeight: '700' }]}>प्रीमियम</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTabActive}>
          <Ionicons name="person" size={20} color="#FFFFFF" />
          <Text style={s.navTabActiveText}>प्रोफ़ाइल</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: th.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: th.bg,
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
    fontSize: 20,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: th.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFEAD0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: th.saffron,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: th.primary,
    fontFamily: serif,
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  profileEmail: {
    fontSize: 12.5,
    color: th.secondaryText,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 4,
  },
  freeUpgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E7D3',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    fontSize: 11.5,
    color: th.secondaryText,
  },
  upgradeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: th.primary,
  },
  menuSection: {
    backgroundColor: th.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: th.border,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7D3',
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: '600',
    color: th.text,
    flex: 1,
  },
  menuValue: {
    fontSize: 13,
    color: th.secondaryText,
    marginRight: 8,
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: th.primary,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: th.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#FFFAF1',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: th.saffron,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(233, 161, 59, 0.18)',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: th.text,
  },
  modalOptionTextActive: {
    color: th.primary,
    fontWeight: '800',
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: th.border,
  },
  navTab: {
    alignItems: 'center',
  },
  navTabText: {
    fontSize: 10,
    color: th.secondaryText,
    marginTop: 2,
  },
  navTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  navTabActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});
