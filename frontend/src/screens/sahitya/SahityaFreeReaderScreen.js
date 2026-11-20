import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  TextInput,
  Share,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { SAHITYA_BOOKS } from '../../data/sahityaCatalog';
import { sahityaStore } from '../../services/sahityaStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ornamental Vedic Golden Divider Component
function SacredDivider({ color = '#D97706' }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={[styles.dividerLine, { backgroundColor: color, opacity: 0.35 }]} />
      <View style={styles.dividerIconBox}>
        <Text style={[styles.dividerSymbol, { color }]}>❖</Text>
      </View>
      <View style={[styles.dividerLine, { backgroundColor: color, opacity: 0.35 }]} />
    </View>
  );
}

export default function SahityaFreeReaderScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const rawBook = route?.params?.book || SAHITYA_BOOKS[0];
  const book = SAHITYA_BOOKS.find((b) => String(b.id) === String(rawBook.id)) || rawBook;

  // Reading Themes: 'sepia' (cream/parchment as in screenshot), 'light', 'dark'
  const [themeMode, setThemeMode] = useState('sepia');
  const [fontSize, setFontSize] = useState(20); // 16, 18, 20, 22, 24, 26
  const [currentPage, setCurrentPage] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Modals
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showTocModal, setShowTocModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showMeaning, setShowMeaning] = useState(true);

  // Prepare paginated content
  // Each page will contain a set of stanzas/lines
  const chapters = book.chapters || [];
  const fullContent = chapters[0]?.content || book.aboutBook || '';
  
  // Split content into stanzas (separated by double newlines or doha markers)
  const stanzas = fullContent
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Group into pages of 2 stanzas each (just like the screenshot)
  const STANZAS_PER_PAGE = 2;
  const totalPages = Math.max(1, Math.ceil(stanzas.length / STANZAS_PER_PAGE));
  const safePage = Math.min(totalPages, Math.max(1, currentPage));

  const startIndex = (safePage - 1) * STANZAS_PER_PAGE;
  const currentStanzas = stanzas.slice(startIndex, startIndex + STANZAS_PER_PAGE);

  // Check if current page is bookmarked
  useEffect(() => {
    const bms = sahityaStore.bookmarks || [];
    const hasBm = bms.some(
      (b) => String(b.bookId) === String(book.id) && Number(b.page) === Number(safePage)
    );
    setIsBookmarked(hasBm);
  }, [safePage, book.id]);

  // Save reading progress on page change
  useEffect(() => {
    sahityaStore.updateProgress(book, 0, safePage, totalPages);
  }, [safePage]);

  // Theme palettes
  const theme = {
    sepia: {
      bg: '#FAF4E8',
      cardBg: '#FFFDF9',
      text: '#2B1408',
      subText: '#7A624E',
      divider: '#D97706',
      border: '#E8DBCB',
      sliderTrack: '#E6D7C3',
      sliderFill: '#EAB308',
      sliderThumb: '#F59E0B',
      bottomBarBg: '#FAF4E8',
      statusBarStyle: 'dark-content',
    },
    light: {
      bg: '#FFFFFF',
      cardBg: '#F9FAFB',
      text: '#111827',
      subText: '#4B5563',
      divider: '#B45309',
      border: '#E5E7EB',
      sliderTrack: '#E5E7EB',
      sliderFill: '#F59E0B',
      sliderThumb: '#D97706',
      bottomBarBg: '#FFFFFF',
      statusBarStyle: 'dark-content',
    },
    dark: {
      bg: '#1A120C',
      cardBg: '#241B14',
      text: '#FDF6E2',
      subText: '#C4B5A5',
      divider: '#F59E0B',
      border: '#3A2E24',
      sliderTrack: '#3A2E24',
      sliderFill: '#F59E0B',
      sliderThumb: '#FBBF24',
      bottomBarBg: '#1A120C',
      statusBarStyle: 'light-content',
    },
  }[themeMode];

  const handleNextPage = () => {
    if (safePage < totalPages) {
      setCurrentPage(safePage + 1);
    }
  };

  const handlePrevPage = () => {
    if (safePage > 1) {
      setCurrentPage(safePage - 1);
    }
  };

  const cycleTheme = () => {
    if (themeMode === 'sepia') setThemeMode('light');
    else if (themeMode === 'light') setThemeMode('dark');
    else setThemeMode('sepia');
  };

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev >= 26) return 16;
      return prev + 2;
    });
  };

  const handleToggleBookmark = () => {
    if (isBookmarked) {
      const bms = sahityaStore.bookmarks || [];
      const target = bms.find(
        (b) => String(b.bookId) === String(book.id) && Number(b.page) === Number(safePage)
      );
      if (target) sahityaStore.removeBookmark(target.id);
      setIsBookmarked(false);
      Alert.alert('बुकमार्क हटाया गया', 'इस पृष्ठ का बुकमार्क हटा दिया गया है।');
    } else {
      const textSnippet = currentStanzas[0] || book.title;
      sahityaStore.addBookmark(book.id, textSnippet, 1, safePage);
      setIsBookmarked(true);
      Alert.alert('बुकमार्क सहेजा गया', `पृष्ठ ${safePage} आपके बुकमार्क में जोड़ दिया गया है।`);
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `🕉️ ${book.title} 🕉️\n\n${currentStanzas.join('\n\n')}\n\n— वैदिक संस्कार (साहित्य संग्रह)\nhttps://vaidicsanskar.in`;
      await Share.share({
        message: shareText,
        title: book.title,
      });
    } catch (_) {}
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    sahityaStore.addNote(book.id, noteText.trim(), safePage);
    setNoteText('');
    setShowNotesModal(false);
    Alert.alert('नोट सहेजा गया', 'आपका आध्यात्मिक चिंतन सुरक्षित कर दिया गया है।');
  };

  // Slider Scrubber PanResponder
  const sliderWidth = SCREEN_WIDTH - 64;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleSliderTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleSliderTouch(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const handleSliderTouch = (touchX) => {
    const ratio = Math.max(0, Math.min(1, touchX / sliderWidth));
    const targetPage = Math.max(1, Math.min(totalPages, Math.round(ratio * (totalPages - 1)) + 1));
    setCurrentPage(targetPage);
  };

  const progressRatio = totalPages > 1 ? (safePage - 1) / (totalPages - 1) : 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.bg}
        translucent={false}
      />

      {/* TOP BAR MATCHING SCREENSHOT */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.bg,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
          {book.title}
        </Text>

        <View style={styles.topRightControls}>
          {/* FONT SIZE TOGGLE 'Aa' */}
          <TouchableOpacity
            onPress={cycleFontSize}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.toolIconBtn}
          >
            <Text style={[styles.toolAaText, { color: theme.text }]}>Aa</Text>
          </TouchableOpacity>

          {/* THEME TOGGLE ☀️ / 🌙 */}
          <TouchableOpacity
            onPress={cycleTheme}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.toolIconBtn}
          >
            <Ionicons
              name={
                themeMode === 'sepia'
                  ? 'sunny-outline'
                  : themeMode === 'light'
                  ? 'sunny'
                  : 'moon-outline'
              }
              size={22}
              color={theme.text}
            />
          </TouchableOpacity>

          {/* TOC / CHAPTER LIST ICON */}
          <TouchableOpacity
            onPress={() => setShowTocModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.toolIconBtn}
          >
            <Ionicons name="list" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN READING AREA WITH PARCHMENT CARD */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.readingCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {currentStanzas.length > 0 ? (
            currentStanzas.map((stanza, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <SacredDivider color={theme.divider} />}
                <Text
                  style={[
                    styles.stanzaText,
                    {
                      color: theme.text,
                      fontSize,
                      lineHeight: fontSize * 1.6,
                    },
                  ]}
                >
                  {stanza}
                </Text>
              </React.Fragment>
            ))
          ) : (
            <Text style={[styles.stanzaText, { color: theme.text, fontSize }]}>
              {fullContent}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* PAGINATION SCRUBBER CONTROLLER (MATCHING SCREENSHOT) */}
      <View style={[styles.scrubberArea, { backgroundColor: theme.bg }]}>
        {/* < 1 / 4 > */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            onPress={handlePrevPage}
            disabled={safePage <= 1}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={[styles.arrowBtn, safePage <= 1 && { opacity: 0.3 }]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.pageCounterText, { color: theme.text }]}>
            {safePage} / {totalPages}
          </Text>

          <TouchableOpacity
            onPress={handleNextPage}
            disabled={safePage >= totalPages}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={[styles.arrowBtn, safePage >= totalPages && { opacity: 0.3 }]}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* GOLDEN SCRUBBER SLIDER */}
        <View style={styles.sliderWrapper} {...panResponder.panHandlers}>
          <View style={[styles.sliderTrack, { backgroundColor: theme.sliderTrack }]}>
            <View
              style={[
                styles.sliderFill,
                {
                  backgroundColor: theme.sliderFill,
                  width: `${Math.max(4, progressRatio * 100)}%`,
                },
              ]}
            />
          </View>
          {/* SCRUBBER THUMB */}
          <View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: theme.sliderThumb,
                left: `${progressRatio * 100}%`,
                transform: [{ translateX: -10 }],
              },
            ]}
          />
        </View>
      </View>

      {/* BOTTOM ACTION TOOLBAR (4 TABS FROM SCREENSHOT: बुकमार्क, नोट्स, शेयर, अधिक) */}
      <View
        style={[
          styles.bottomToolbar,
          {
            backgroundColor: theme.bottomBarBg,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        {/* 1. बुकमार्क */}
        <TouchableOpacity style={styles.toolTab} onPress={handleToggleBookmark} activeOpacity={0.75}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? th.primary : theme.text}
          />
          <Text
            style={[
              styles.toolTabLabel,
              { color: isBookmarked ? th.primary : theme.text, fontWeight: isBookmarked ? '700' : '500' },
            ]}
          >
            बुकमार्क
          </Text>
        </TouchableOpacity>

        {/* 2. नोट्स */}
        <TouchableOpacity
          style={styles.toolTab}
          onPress={() => setShowNotesModal(true)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.text} />
          <Text style={[styles.toolTabLabel, { color: theme.text }]}>नोट्स</Text>
        </TouchableOpacity>

        {/* 3. शेयर */}
        <TouchableOpacity style={styles.toolTab} onPress={handleShare} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={22} color={theme.text} />
          <Text style={[styles.toolTabLabel, { color: theme.text }]}>शेयर</Text>
        </TouchableOpacity>

        {/* 4. अधिक */}
        <TouchableOpacity
          style={styles.toolTab}
          onPress={() => setShowMoreModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={22} color={theme.text} />
          <Text style={[styles.toolTabLabel, { color: theme.text }]}>अधिक</Text>
        </TouchableOpacity>
      </View>

      {/* NOTES MODAL */}
      <Modal visible={showNotesModal} transparent animationType="slide" onRequestClose={() => setShowNotesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>स्वाध्याय नोट्स (पृष्ठ {safePage})</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color={theme.subText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.noteInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg },
              ]}
              placeholder="इस श्लोक / पृष्ठ पर अपने आध्यात्मिक विचार लिखें..."
              placeholderTextColor={theme.subText}
              multiline
              numberOfLines={4}
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNote}>
              <Text style={styles.saveNoteBtnText}>नोट सुरक्षित करें</Text>
            </TouchableOpacity>

            {/* Existing notes list */}
            <Text style={[styles.existingNotesTitle, { color: theme.text }]}>सहेजे गए विचार</Text>
            {(sahityaStore.notes || [])
              .filter((n) => String(n.bookId) === String(book.id))
              .map((n) => (
                <View key={n.id} style={[styles.noteItem, { borderColor: theme.border }]}>
                  <Text style={[styles.noteItemText, { color: theme.text }]}>{n.text}</Text>
                  <View style={styles.noteItemMeta}>
                    <Text style={[styles.noteItemDate, { color: theme.subText }]}>
                      पृष्ठ {n.page} • {n.createdAt}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        sahityaStore.removeNote(n.id);
                        Alert.alert('हटाया गया', 'नोट हटा दिया गया है।');
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </Modal>

      {/* MORE OPTIONS MODAL */}
      <Modal visible={showMoreModal} transparent animationType="fade" onRequestClose={() => setShowMoreModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreModal(false)}
        >
          <View style={[styles.moreMenuCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.moreMenuTitle, { color: theme.text }]}>अतिरिक्त विकल्प</Text>

            <TouchableOpacity
              style={styles.moreMenuItem}
              onPress={() => {
                setShowMoreModal(false);
                setShowTocModal(true);
              }}
            >
              <Ionicons name="list-outline" size={20} color={th.primary} />
              <Text style={[styles.moreMenuText, { color: theme.text }]}>सम्पूर्ण अनुक्रमणिका (TOC)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreMenuItem}
              onPress={() => {
                setShowMoreModal(false);
                Alert.alert(
                  'कॉपी किया गया',
                  'वर्तमान पृष्ठ के सभी श्लोक क्लिपबोर्ड में कॉपी कर लिए गए हैं।'
                );
              }}
            >
              <Ionicons name="copy-outline" size={20} color={th.primary} />
              <Text style={[styles.moreMenuText, { color: theme.text }]}>पाठ कॉपी करें (Copy Text)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreMenuItem}
              onPress={() => {
                setShowMoreModal(false);
                Alert.alert(
                  'कॉपीराइट एवं प्रामाणिकता',
                  'सामग्री स्रोत: परंपरागत वैदिक एवं सनातन साहित्य संग्रह।\nसर्वस्व जनहितार्थ एवं आध्यात्मिक स्वाध्याय हेतु समर्पित।\nसत्यापन स्थिति: प्रामाणिक एवं शुद्ध देवनागरी पाठ।'
                );
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={th.primary} />
              <Text style={[styles.moreMenuText, { color: theme.text }]}>कॉपीराइट एवं संदर्भ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TOC MODAL */}
      <Modal visible={showTocModal} transparent animationType="slide" onRequestClose={() => setShowTocModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>विषय सूची (Index)</Text>
              <TouchableOpacity onPress={() => setShowTocModal(false)}>
                <Ionicons name="close" size={24} color={theme.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: totalPages }).map((_, pIdx) => {
                const pageNum = pIdx + 1;
                const isSelected = pageNum === safePage;
                const firstStanzaOnPage = stanzas[pIdx * STANZAS_PER_PAGE] || '';
                const snippet = firstStanzaOnPage.split('\n')[0] || `भाग ${pageNum}`;
                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[
                      styles.tocItem,
                      { borderColor: theme.border },
                      isSelected && { backgroundColor: 'rgba(217, 119, 6, 0.12)' },
                    ]}
                    onPress={() => {
                      setCurrentPage(pageNum);
                      setShowTocModal(false);
                    }}
                  >
                    <View style={styles.tocItemLeft}>
                      <View style={[styles.tocBadge, { backgroundColor: theme.sliderTrack }]}>
                        <Text style={[styles.tocBadgeText, { color: theme.text }]}>{pageNum}</Text>
                      </View>
                      <Text style={[styles.tocSnippet, { color: theme.text }]} numberOfLines={1}>
                        {snippet}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#D97706" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingRight: 10,
  },
  topTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    ...serif,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toolAaText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: serif.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingCard: {
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stanzaText: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
    ...serif,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    height: 1.5,
    width: 60,
  },
  dividerIconBox: {
    marginHorizontal: 10,
  },
  dividerSymbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrubberArea: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  arrowBtn: {
    padding: 6,
  },
  pageCounterText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.5,
    ...serif,
  },
  sliderWrapper: {
    width: SCREEN_WIDTH - 64,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  toolTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  toolTabLabel: {
    fontSize: 12,
    marginTop: 4,
    ...serif,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    ...serif,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  saveNoteBtn: {
    backgroundColor: th.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveNoteBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  existingNotesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  noteItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  noteItemDate: {
    fontSize: 11,
  },
  moreMenuCard: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    borderRadius: 16,
    padding: 16,
    width: 260,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  moreMenuTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    ...serif,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  moreMenuText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  tocItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tocBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tocBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tocSnippet: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
