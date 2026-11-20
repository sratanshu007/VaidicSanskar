import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { SAHITYA_BOOKS } from '../../data/sahityaCatalog';
import { sahityaStore } from '../../services/sahityaStore';

export default function SahityaHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [isPremium, setIsPremium] = useState(sahityaStore.isPremiumUser());

  useEffect(() => {
    const unsub = sahityaStore.subscribe(() => {
      setIsPremium(sahityaStore.isPremiumUser());
    });
    return unsub;
  }, []);

  const popularBooks = SAHITYA_BOOKS.filter(
    (b) => b.id === '17' || b.id === '2' || b.id === '1' || b.id === '4'
  );
  const recentBooks = SAHITYA_BOOKS.filter(
    (b) => b.id === '7' || b.id === '5' || b.id === '6' || b.id === '9' || b.id === '10'
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={th.darkMaroon} translucent={false} />

      {/* TOP MAROON HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF5E5" />
          </TouchableOpacity>

          <Image
            source={require('../../../assets/sahitya/sahitya_icon.png')}
            style={s.logoCircle}
            resizeMode="cover"
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={s.headerAppTitle}>आरती संग्रह</Text>
            <Text style={s.headerAppSub}>नित्य वंदन • स्तुति • भक्ति</Text>
          </View>
        </View>

        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => navigation.navigate('NotificationCenter')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFF5E5" />
          <View style={s.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HERO CARD: RISHI WRITING IN SUNLIGHT */}
        <View style={s.heroBanner}>
          <Image
            source={require('../../../assets/sahitya/rishi_hero_banner.png')}
            style={s.heroBannerImg}
            resizeMode="cover"
          />
          <View style={s.heroOverlay}>
            <View style={s.heroQuoteBox}>
              <Text style={s.heroQuoteText}>"आरती व वंदन से</Text>
              <Text style={s.heroQuoteText}>जीवन पावन होता है"</Text>
              <Text style={s.heroSub}>Explore sacred daily aartis & stutis</Text>
            </View>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={20} color="#80645A" style={{ marginRight: 10 }} />
          <TextInput
            style={s.searchInput}
            placeholder="आरती, स्तुति, श्लोक या देवी-देवता खोजें..."
            placeholderTextColor="#80645A"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              if (search.trim()) {
                navigation.navigate('SahityaCategory', { searchQuery: search });
              }
            }}
          />
        </View>

        {/* SECTION 1: श्रेणियाँ (CATEGORIES) */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>देव-देवी आरतियाँ</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SahityaCategory', { categoryId: 'all' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.seeAllLink}>सभी देखें →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 6 }}>
          {[
            { id: 'ganesh', label: 'गणेश जी', icon: 'bell-ring' },
            { id: 'shiv', label: 'शिव जी', icon: 'om' },
            { id: 'vishnu', label: 'विष्णु जी', icon: 'flower' },
            { id: 'durga', label: 'माँ दुर्गा', icon: 'flare' },
            { id: 'hanuman', label: 'हनुमान जी', icon: 'shield' },
            { id: 'ram', label: 'श्री राम', icon: 'crown' },
            { id: 'krishna', label: 'श्री कृष्ण', icon: 'feather' },
            { id: 'lakshmi', label: 'माँ लक्ष्मी', icon: 'hand-coin' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.categoryCard, { marginRight: 12, minWidth: 72 }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SahityaCategory', { categoryId: cat.id })}
            >
              <View style={s.catIconBox}>
                <MaterialCommunityIcons name={cat.icon} size={24} color={th.primary} />
              </View>
              <Text style={s.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SECTION 2: लोकप्रिय आरतियाँ (POPULAR AARTIS) */}
        <View style={[s.sectionHeader, { marginTop: 20 }]}>
          <Text style={s.sectionTitle}>लोकप्रिय आरतियाँ</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SahityaCategory', { categoryId: 'all' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.seeAllLink}>सभी देखें →</Text>
          </TouchableOpacity>
        </View>

        {popularBooks.map((book) => (
          <View key={book.id} style={s.popularCard}>
            <TouchableOpacity
              style={s.popularThumbBox}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('SahityaBookDetail', { book })}
            >
              <Image
                source={book.coverImage || require('../../../assets/sahitya/sahitya_icon.png')}
                style={s.popularThumbImg}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={s.popularDetails}>
              <View style={s.bookTitleRow}>
                <Text style={s.popularTitle}>{book.title}</Text>
                {/* GOLDEN CROWN ICON */}
                <View style={s.crownBadge}>
                  <MaterialCommunityIcons name="crown" size={15} color={th.saffron} />
                </View>
              </View>

              <Text style={s.popularAuthor}>{book.author}</Text>

              {/* ACTION BUTTONS: READ & DETAILS */}
              <View style={s.actionBtnsRow}>
                {/* 1. READ FULL TEXT */}
                <TouchableOpacity
                  style={s.readBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('SahityaFreeReader', { book })}
                >
                  <Ionicons name="book-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={s.readBtnText}>सम्पूर्ण पाठ पढ़ें</Text>
                </TouchableOpacity>

                {/* 2. DETAILS BUTTON */}
                <TouchableOpacity
                  style={s.listenBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('SahityaBookDetail', { book })}
                >
                  <Ionicons name="information-circle-outline" size={14} color={th.primary} style={{ marginRight: 4 }} />
                  <Text style={s.listenBtnText}>विवरण देखें</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* SECTION 3: दैनिक स्तुति व आरतियाँ */}
        <View style={[s.sectionHeader, { marginTop: 20 }]}>
          <Text style={s.sectionTitle}>दैनिक स्तुति व आरतियाँ</Text>
        </View>

        {recentBooks.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={s.recentCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('SahityaBookDetail', { book })}
          >
            <Image source={book.coverImage} style={s.recentThumb} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.recentTitle}>{book.title}</Text>
              <Text style={s.recentAuthor}>{book.author}</Text>
              <Text style={s.recentMeta}>
                👁 {book.reads || '10k+ पाठ'} • 📄 {book.prakar || 'पवित्र पाठ'}
              </Text>
            </View>
            <TouchableOpacity style={s.quickReadBtn} onPress={() => navigation.navigate('SahityaFreeReader', { book })}>
              <Text style={s.quickReadText}>आरती पढ़ें</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={[s.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.navTabActive}>
          <Ionicons name="home" size={20} color="#FFFFFF" />
          <Text style={s.navTabActiveText}>होम</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaMyBooks')}>
          <Ionicons name="book-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>मेरी आरतियाँ</Text>
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

        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaSettings')}>
          <Ionicons name="person-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>प्रोफ़ाइल</Text>
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
    backgroundColor: th.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 8,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAppTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF5E5',
    fontFamily: serif,
  },
  headerAppSub: {
    fontSize: 10.5,
    color: '#FDE68A',
    fontWeight: '600',
    marginTop: 1,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 85,
  },
  heroBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 155,
    backgroundColor: th.darkMaroon,
    position: 'relative',
    elevation: 4,
    shadowColor: th.darkMaroon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroBannerImg: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(50, 8, 12, 0.25)',
  },
  heroQuoteBox: {
    maxWidth: '70%',
    alignSelf: 'flex-end',
  },
  heroQuoteText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF5E5',
    fontFamily: serif,
    textAlign: 'right',
  },
  heroSub: {
    fontSize: 11,
    color: '#FDE68A',
    textAlign: 'right',
    marginTop: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: th.border,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: th.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  seeAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: th.primary,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23%',
    backgroundColor: th.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: th.border,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 1,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: th.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: th.text,
  },
  popularCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: th.border,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  popularThumbBox: {
    width: 76,
    height: 104,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  popularThumbImg: {
    width: '100%',
    height: '100%',
  },
  popularDetails: {
    flex: 1,
    marginLeft: 14,
  },
  bookTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popularTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
  },
  crownBadge: {
    backgroundColor: '#FEF3C7',
    padding: 3,
    borderRadius: 6,
  },
  popularAuthor: {
    fontSize: 13,
    color: th.secondaryText,
    marginTop: 2,
    marginBottom: 10,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  readBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: th.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  listenBtnText: {
    color: th.primary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: th.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: th.border,
    padding: 10,
    marginBottom: 10,
  },
  recentThumb: {
    width: 48,
    height: 64,
    borderRadius: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: th.text,
  },
  recentAuthor: {
    fontSize: 12,
    color: th.secondaryText,
    marginTop: 2,
  },
  recentMeta: {
    fontSize: 10.5,
    color: '#8A7B6E',
    marginTop: 3,
  },
  quickReadBtn: {
    backgroundColor: th.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickReadText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
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
