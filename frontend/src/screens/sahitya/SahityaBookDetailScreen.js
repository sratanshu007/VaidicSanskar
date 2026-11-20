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
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { SAHITYA_BOOKS } from '../../data/sahityaCatalog';
import { sahityaStore } from '../../services/sahityaStore';

export default function SahityaBookDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const rawBook = route?.params?.book || SAHITYA_BOOKS[0];
  const book = SAHITYA_BOOKS.find((b) => String(b.id) === String(rawBook.id)) || rawBook;

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = book.totalPages || 4;

  const currentChapter = book.chapters ? book.chapters[0] : null;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      sahityaStore.updateProgress(book, 0, next, totalPages);
    } else {
      navigation.navigate('SahityaFreeReader', { book });
    }
  };

  const toggleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (next && currentChapter) {
      sahityaStore.addBookmark(book.id, currentChapter.heading, 1, currentPage);
      Alert.alert('बुकमार्क सहेजा गया', 'यह पाठ आपके बुकमार्क में सुरक्षित कर दिया गया है।');
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `🕉️ ${book.title} 🕉️\n\n${book.author || 'वैदिक साहित्य'}\n\n${book.quoteSummary || ''}\n\n— वैदिक संस्कार (साहित्य संग्रह)\nhttps://vaidicsanskar.in`;
      await Share.share({
        message: shareText,
        title: book.title,
      });
    } catch (_) {}
  };

  const bg = isDarkMode ? '#1E1614' : th.bg;
  const cardBg = isDarkMode ? '#281F1C' : th.cardBg;
  const textColor = isDarkMode ? '#F5E6D3' : th.text;
  const subTextColor = isDarkMode ? '#C4B5A5' : th.secondaryText;
  const borderColor = isDarkMode ? '#3A2E28' : th.border;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={th.darkMaroon}
        translucent={false}
      />

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF5E5" />
        </TouchableOpacity>

        <Text style={s.headerTitle} numberOfLines={1}>
          {book.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={toggleBookmark}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={s.actionBtn}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color="#FFF5E5"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={s.actionBtn}
          >
            <Ionicons name="share-social-outline" size={22} color="#FFF5E5" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* BOOK SHOWCASE CARD */}
        <View style={[s.bookHeaderCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={s.bookCoverBox}>
            <Image
              source={book.coverImage || require('../../../assets/sahitya/godan_cover.png')}
              style={s.bookCoverImg}
              resizeMode="cover"
            />
          </View>

          <View style={s.bookInfoCol}>
            <Text style={[s.bookMainTitle, { color: textColor }]}>{book.title}</Text>
            <Text style={[s.bookAuthorName, { color: subTextColor }]}>{book.author}</Text>

            <View style={s.ratingRow}>
              <Ionicons name="star" size={15} color="#F59E0B" />
              <Text style={[s.ratingLabel, { color: textColor }]}>
                {' '}
                {book.rating || '5.0'} ({book.readersCount || '50k+ भक्त'})
              </Text>
            </View>

            {/* ACTION ROW */}
            <View style={s.quickActionRow}>
              <TouchableOpacity
                style={s.primaryReadBtn}
                onPress={() => navigation.navigate('SahityaFreeReader', { book })}
              >
                <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={s.primaryReadBtnText}>सम्पूर्ण पाठ पढ़ें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SUMMARY QUOTE BANNER */}
        {book.quoteSummary ? (
          <View style={s.quoteBanner}>
            <Text style={s.quoteBannerText}>"{book.quoteSummary}"</Text>
          </View>
        ) : null}

        {/* SECTION: 📖 पाठ का अंश */}
        <View style={[s.readingSection, { backgroundColor: cardBg, borderColor }]}>
          <View style={s.readingSectionHeader}>
            <Ionicons name="book-outline" size={18} color={th.primary} style={{ marginRight: 6 }} />
            <Text style={[s.readingSectionTitle, { color: textColor }]}>
              {book.prakar === 'चालीसा' ? 'चालीसा पाठ' : 'आरती व स्तुति पाठ'}
            </Text>
            <View style={s.readingSectionTools}>
              <TouchableOpacity
                onPress={() => setFontSize((f) => (f >= 22 ? 15 : f + 2))}
                style={s.toolBtn}
              >
                <Text style={[s.toolBtnText, { color: textColor }]}>Aa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsDarkMode(!isDarkMode)}
                style={s.toolBtn}
              >
                <Ionicons
                  name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
                  size={16}
                  color={textColor}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* CHAPTER / STANZA CONTENT */}
          <Text
            style={[
              s.readingBodyText,
              { color: textColor, fontSize, lineHeight: fontSize * 1.6 },
            ]}
          >
            {currentChapter?.content || book.aboutBook}
          </Text>

          {/* PAGING FOOTER */}
          <View style={s.readerFooter}>
            <Text style={[s.pageCounter, { color: subTextColor }]}>
              पृष्ठ {currentPage} / {totalPages}
            </Text>

            <View style={s.progressBarTrack}>
              <View
                style={[
                  s.progressBarFill,
                  { width: `${(currentPage / totalPages) * 100}%` },
                ]}
              />
            </View>

            <TouchableOpacity
              style={s.nextPageBtn}
              onPress={handleNextPage}
            >
              <Text style={s.nextPageBtnText}>अगला →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FULL CHAPTERS CTA */}
        <TouchableOpacity
          style={s.fullReaderBtn}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('SahityaFreeReader', { book })}
        >
          <Ionicons name="open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={s.fullReaderBtnText}>विस्तृत स्वाध्याय मोड में खोलें</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
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
    maxWidth: '65%',
  },
  actionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  bookHeaderCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bookCoverBox: {
    width: 95,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  bookCoverImg: {
    width: '100%',
    height: '100%',
  },
  bookInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  bookMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    ...serif,
  },
  bookAuthorName: {
    fontSize: 13,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  primaryReadBtn: {
    backgroundColor: th.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryReadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quoteBanner: {
    backgroundColor: '#FFF5E5',
    borderLeftWidth: 3,
    borderLeftColor: th.saffron,
    padding: 12,
    borderRadius: 8,
    marginVertical: 14,
  },
  quoteBannerText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7C6C5E',
    lineHeight: 18,
  },
  readingSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  readingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  readingSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    ...serif,
  },
  readingSectionTools: {
    flexDirection: 'row',
  },
  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  toolBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  readingBodyText: {
    ...serif,
    marginBottom: 16,
  },
  readerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE1',
  },
  pageCounter: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#EADBCE',
    borderRadius: 2,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: th.primary,
  },
  nextPageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFF5E5',
  },
  nextPageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: th.primary,
  },
  fullReaderBtn: {
    backgroundColor: th.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: th.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  fullReaderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
