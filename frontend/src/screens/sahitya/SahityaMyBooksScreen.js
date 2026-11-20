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
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore } from '../../services/sahityaStore';
import { SAHITYA_BOOKS } from '../../data/sahityaCatalog';

export default function SahityaMyBooksScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'favorites' | 'bookmarks'
  const [myBooks, setMyBooks] = useState(sahityaStore.getMyBooks());
  const [favorites, setFavorites] = useState(sahityaStore.favorites);
  const [bookmarks, setBookmarks] = useState(sahityaStore.bookmarks);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPremium, setIsPremium] = useState(sahityaStore.isPremiumUser());

  useEffect(() => {
    const unsub = sahityaStore.subscribe(() => {
      setMyBooks([...sahityaStore.getMyBooks()]);
      setFavorites([...sahityaStore.favorites]);
      setBookmarks([...sahityaStore.bookmarks]);
      setIsPremium(sahityaStore.isPremiumUser());
    });
    return unsub;
  }, []);

  const handleContinueReading = (book) => {
    navigation.navigate('SahityaFreeReader', { book, chapterIndex: 0 });
  };

  const handleBookOptions = (item) => {
    Alert.alert(
      item.book?.title || 'विकल्प',
      'आप क्या करना चाहते हैं?',
      [
        {
          text: 'पढ़ना जारी रखें',
          onPress: () => handleContinueReading(item.book),
        },
        {
          text: 'विवरण देखें',
          onPress: () => navigation.navigate('SahityaBookDetail', { book: item.book }),
        },
        {
          text: 'लाइब्रेरी से हटाएं',
          style: 'destructive',
          onPress: () => sahityaStore.removeBookFromMyBooks(item.bookId),
        },
        { text: 'रद्द करें', style: 'cancel' },
      ]
    );
  };

  const filteredBooks = myBooks.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.book?.title?.toLowerCase().includes(q) ||
      item.book?.author?.toLowerCase().includes(q)
    );
  });

  const favoriteBooksList = SAHITYA_BOOKS.filter((b) => favorites.includes(b.id));

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

        <Text style={s.headerTitle}>मेरी आरतियाँ</Text>

        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => setSearchVisible(!searchVisible)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="search-outline" size={22} color={th.primary} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR (Toggleable) */}
      {searchVisible && (
        <View style={s.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color={th.secondaryText} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="अपनी आरतियों में खोजें..."
            placeholderTextColor="#8C7D73"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={th.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* FILTER TABS (Horizontal Scroll) */}
      <View style={{ maxHeight: 52 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}
        >
          {[
            { key: 'reading', label: 'पढ़ी जा रही' },
            { key: 'all', label: 'सभी पुस्तकें' },
            { key: 'downloaded', label: 'डाउनलोड' },
            { key: 'favorites', label: 'पसंदीदा' },
            { key: 'bookmarks', label: 'बुकमार्क' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabPill, activeTab === tab.key && s.tabPillActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabPillText, activeTab === tab.key && s.tabPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT LIST */}
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(activeTab === 'reading' || activeTab === 'all' || activeTab === 'downloaded') && (
          <>
            {filteredBooks.filter((item) => activeTab !== 'downloaded' || item.isDownloaded).length === 0 ? (
              <View style={s.emptyBox}>
                <MaterialCommunityIcons name="book-open-page-variant" size={48} color={th.secondaryText} />
                <Text style={s.emptyTitle}>
                  {activeTab === 'downloaded' ? 'कोई डाउनलोड की गई पुस्तक नहीं' : 'कोई पुस्तक नहीं मिली'}
                </Text>
                <Text style={s.emptySub}>
                  {activeTab === 'downloaded'
                    ? 'ऑफ़लाइन पढ़ने अथवा सुनने के लिए पुस्तकें डाउनलोड करें।'
                    : 'लाइब्रेरी से पुस्तकें जोड़कर पढ़ना शुरू करें।'}
                </Text>
              </View>
            ) : (
              filteredBooks
                .filter((item) => activeTab !== 'downloaded' || item.isDownloaded)
                .map((item) => {
                const book = item.book;
                const cover =
                  book?.coverImage || require('../../../assets/sahitya/sahitya_icon.png');
                const isComplete = item.isCompleted || item.progressPercent >= 100;

                return (
                  <View key={item.bookId} style={s.bookCard}>
                    <TouchableOpacity
                      style={s.cardThumbContainer}
                      onPress={() => navigation.navigate('SahityaBookDetail', { book })}
                    >
                      <Image source={cover} style={s.cardThumb} resizeMode="cover" />
                    </TouchableOpacity>

                    <View style={s.cardDetails}>
                      <View style={s.cardTitleRow}>
                        <Text style={s.cardTitle} numberOfLines={1}>
                          {book?.title || 'आरती'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleBookOptions(item)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color={th.secondaryText} />
                        </TouchableOpacity>
                      </View>

                      <Text style={s.cardAuthor}>{book?.author || 'लेखक'}</Text>

                      {/* Progress or Completion */}
                      <View style={s.progressRow}>
                        <Text
                          style={[
                            s.progressText,
                            isComplete && { color: th.success, fontWeight: '700' },
                          ]}
                        >
                          {item.statusText || `${item.progressPercent}% पढ़ी गई`}
                        </Text>
                      </View>

                      {!isComplete && (
                        <View style={s.progressBarTrack}>
                          <View
                            style={[
                              s.progressBarFill,
                              { width: `${Math.min(100, item.progressPercent)}%` },
                            ]}
                          />
                        </View>
                      )}

                      {/* Bottom actions */}
                      <View style={s.cardActionRow}>
                        <TouchableOpacity
                          style={[s.resumeBtn, isComplete && s.reReadBtn, { flex: 1 }]}
                          onPress={() => handleContinueReading(book)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="book-outline" size={14} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={[s.resumeBtnText, isComplete && s.reReadBtnText]}>
                            {isComplete ? 'पुनः पढ़ें' : 'स्वाध्याय जारी रखें'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favoriteBooksList.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="heart-outline" size={48} color={th.secondaryText} />
                <Text style={s.emptyTitle}>कोई पसंदीदा पुस्तक नहीं</Text>
                <Text style={s.emptySub}>किसी भी पुस्तक के विवरण पृष्ठ पर ❤️ दबाकर पसंदीदा बनाएं।</Text>
              </View>
            ) : (
              favoriteBooksList.map((book) => (
                <View key={book.id} style={s.bookCard}>
                  <Image source={book.coverImage} style={s.cardThumb} resizeMode="cover" />
                  <View style={s.cardDetails}>
                    <Text style={s.cardTitle}>{book.title}</Text>
                    <Text style={s.cardAuthor}>{book.author}</Text>
                    <Text style={s.favCategoryText}>श्रेणी: {book.categoryName}</Text>
                    <View style={s.cardActionRow}>
                      <TouchableOpacity
                        style={s.resumeBtn}
                        onPress={() => handleContinueReading(book)}
                      >
                        <Text style={s.resumeBtnText}>पढ़ें</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'bookmarks' && (
          <>
            {bookmarks.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="bookmark-outline" size={48} color={th.secondaryText} />
                <Text style={s.emptyTitle}>कोई बुकमार्क नहीं</Text>
                <Text style={s.emptySub}>पुस्तक पढ़ते समय किसी भी अंश को बुकमार्क करें।</Text>
              </View>
            ) : (
              bookmarks.map((bm) => (
                <View key={bm.id} style={s.bookmarkCard}>
                  <View style={s.bmHeader}>
                    <Ionicons name="bookmark" size={18} color={th.saffron} />
                    <Text style={s.bmMeta}>{bm.createdAt} • पृष्ठ {bm.page}</Text>
                    <TouchableOpacity
                      onPress={() => sahityaStore.removeBookmark(bm.id)}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.bmText}>"{bm.text}"</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={[s.bottomNavBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.navTab} onPress={() => navigation.navigate('SahityaHome')}>
          <Ionicons name="home-outline" size={20} color={th.secondaryText} />
          <Text style={s.navTabText}>होम</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navTabActive}>
          <Ionicons name="book" size={20} color="#FFFFFF" />
          <Text style={s.navTabActiveText}>मेरी आरतियाँ</Text>
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: th.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: th.text,
    paddingVertical: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3E7D3',
    marginRight: 10,
  },
  tabPillActive: {
    backgroundColor: th.primary,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: th.secondaryText,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: th.cardBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: th.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardThumbContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  cardThumb: {
    width: 68,
    height: 94,
    borderRadius: 8,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: th.text,
    fontFamily: serif,
    flex: 1,
  },
  cardAuthor: {
    fontSize: 12.5,
    color: th.secondaryText,
    marginTop: 2,
  },
  progressRow: {
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: th.primary,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#EBDCCE',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: th.primary,
    borderRadius: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resumeBtn: {
    backgroundColor: th.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 10,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reReadBtn: {
    backgroundColor: '#EBDCCE',
  },
  reReadBtnText: {
    color: th.text,
  },
  audioMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: th.primary,
    backgroundColor: '#FFF0DE',
  },
  audioMiniText: {
    fontSize: 11.5,
    color: th.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  favCategoryText: {
    fontSize: 12,
    color: th.secondaryText,
    marginTop: 4,
  },
  bookmarkCard: {
    backgroundColor: th.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: th.saffron,
    borderWidth: 1,
    borderColor: th.border,
  },
  bmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bmMeta: {
    fontSize: 11,
    color: th.secondaryText,
    marginLeft: 6,
  },
  bmText: {
    fontSize: 13.5,
    color: th.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: th.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: th.secondaryText,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
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
