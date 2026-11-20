import React, { useState, useMemo } from 'react';
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
import { SAHITYA_CATEGORIES, SAHITYA_BOOKS } from '../../data/sahityaCatalog';
import { sahityaStore } from '../../services/sahityaStore';

export default function SahityaCategoryScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const initialCategory = route?.params?.category || SAHITYA_CATEGORIES[0];

  const [activeCat, setActiveCat] = useState(initialCategory.id || 'all');
  const [subFilter, setSubFilter] = useState('सभी');
  const [search, setSearch] = useState('');

  const activeCategoryObj =
    SAHITYA_CATEGORIES.find((c) => c.id === activeCat) || SAHITYA_CATEGORIES[0];

  const filteredBooks = useMemo(() => {
    return SAHITYA_BOOKS.filter((b) => {
      const matchCat = activeCat === 'all' || b.category === activeCat;
      const matchSub =
        subFilter === 'सभी' ||
        b.subCategory === subFilter ||
        b.prakar === subFilter;
      const q = search.trim().toLowerCase();
      const matchQ =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.quoteSummary && b.quoteSummary.toLowerCase().includes(q));
      return matchCat && matchSub && matchQ;
    });
  }, [activeCat, subFilter, search]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={th.darkMaroon} translucent={false} />

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF5E5" />
        </TouchableOpacity>

        <Text style={s.headerTitle}>श्रेणियाँ एवं संग्रह</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('SahityaSettings')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.searchToggleBtn}
        >
          <Ionicons name="settings-outline" size={20} color="#FFF5E5" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#7C6C5E" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="आरती, चालीसा या देवता खोजें..."
          placeholderTextColor="#7C6C5E"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color="#7C6C5E" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CATEGORY TABS (HORIZONTAL PILLS) */}
      <View style={s.categoryTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryTabsScroll}
        >
          {SAHITYA_CATEGORIES.map((cat) => {
            const isSelected = activeCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.catPill, isSelected && s.catPillSelected]}
                onPress={() => {
                  setActiveCat(cat.id);
                  setSubFilter('सभी');
                }}
              >
                <Text style={[s.catPillText, isSelected && s.catPillTextSelected]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SUB-CATEGORY FILTERS */}
      {activeCategoryObj?.subCategories && activeCategoryObj.subCategories.length > 1 ? (
        <View style={s.subFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.subFilterScroll}>
            {activeCategoryObj.subCategories.map((sub) => {
              const isSelected = subFilter === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[s.subPill, isSelected && s.subPillSelected]}
                  onPress={() => setSubFilter(sub)}
                >
                  <Text style={[s.subPillText, isSelected && s.subPillTextSelected]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* BOOK LIST */}
      <ScrollView contentContainerStyle={s.bookListScroll} showsVerticalScrollIndicator={false}>
        {filteredBooks.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="book-outline" size={44} color="#C4B5A5" />
            <Text style={s.emptyTitle}>कोई पाठ नहीं मिला</Text>
            <Text style={s.emptySubtitle}>कृपया कोई अन्य श्रेणी या खोज शब्द चुनें।</Text>
          </View>
        ) : (
          filteredBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={s.bookCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('SahityaFreeReader', { book })}
            >
              <View style={s.bookThumbWrap}>
                <Image
                  source={book.coverImage || require('../../../assets/sahitya/sahitya_icon.png')}
                  style={s.bookThumbImg}
                  resizeMode="cover"
                />
              </View>

              <View style={s.bookInfo}>
                <Text style={s.bookTitle}>{book.title}</Text>
                <Text style={s.bookAuthor}>{book.author}</Text>
                <Text style={s.bookMeta}>
                  👁 {book.reads || '10k+ पाठ'} • 📄 {book.prakar || 'पवित्र पाठ'}
                </Text>

                <View style={s.cardActionsRow}>
                  {/* READ BUTTON */}
                  <TouchableOpacity
                    style={s.readBtn}
                    onPress={() => navigation.navigate('SahityaFreeReader', { book })}
                  >
                    <Ionicons name="book-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={s.readBtnText}>सम्पूर्ण पाठ पढ़ें</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={[s.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaHome')}>
          <Ionicons name="home-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>होम</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaMyBooks')}>
          <Ionicons name="book-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>मेरी आरतियाँ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.navTab}
          onPress={() => {
            if (sahityaStore.isPremiumUser()) {
              navigation.navigate('SahityaSubscriptionSuccess');
            } else {
              navigation.navigate('SahityaAudioPaywall');
            }
          }}
        >
          <MaterialCommunityIcons name="crown-outline" size={22} color={th.saffron} />
          <Text style={s.navTabText}>प्रीमियम पठन</Text>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF5E5',
    ...serif,
  },
  searchToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: th.text,
    padding: 0,
  },
  categoryTabsContainer: {
    paddingVertical: 6,
  },
  categoryTabsScroll: {
    paddingHorizontal: 16,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5E5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  catPillSelected: {
    backgroundColor: th.primary,
    borderColor: th.primary,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C6C5E',
  },
  catPillTextSelected: {
    color: '#FFFFFF',
  },
  subFilterContainer: {
    paddingBottom: 8,
  },
  subFilterScroll: {
    paddingHorizontal: 16,
  },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  subPillSelected: {
    backgroundColor: th.saffron,
    borderColor: th.saffron,
  },
  subPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C6C5E',
  },
  subPillTextSelected: {
    color: '#2C0508',
    fontWeight: '700',
  },
  bookListScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EADBCE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bookThumbWrap: {
    width: 70,
    height: 95,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FAF4E8',
  },
  bookThumbImg: {
    width: '100%',
    height: '100%',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: th.text,
    ...serif,
  },
  bookAuthor: {
    fontSize: 12,
    color: th.secondaryText,
    marginTop: 2,
  },
  bookMeta: {
    fontSize: 11,
    color: '#9E8E81',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  readBtn: {
    backgroundColor: th.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: th.text,
    marginTop: 12,
    ...serif,
  },
  emptySubtitle: {
    fontSize: 13,
    color: th.secondaryText,
    marginTop: 4,
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EADBCE',
    paddingTop: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabText: {
    fontSize: 11,
    color: th.secondaryText,
    marginTop: 3,
  },
});
