import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { serif } from '../../theme/styles';
import { useLanguage } from '../../context/LanguageContext';
import { PujaService } from '../../services/api';
import { getPoojaImage } from '../../utils/poojaImages';

const CATEGORIES = ['All', 'Popular', 'Peace', 'Prosperity'];

export default function PujaBrowseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isHindi } = useLanguage();
  const [selectedCat, setSelectedCat] = useState('All');
  const [q, setQ] = useState('');
  const [poojas, setPoojas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    PujaService.list()
      .then((res) => {
        const raw = Array.isArray(res) ? res : res?.pujas || res?.data || [];
        if (raw.length) {
          const mapped = raw.map((p, idx) => ({
            id: String(p._id || p.id || `pooja_${idx}`),
            name: p.name || 'Vedic Pooja',
            hindi: p.hindi || '',
            tagline: p.tagline || p.shortDescription || p.description || 'Vedic Pooja',
            category: p.category || 'Popular',
            price: Number(p.basePrice || p.price || 2500),
            duration: p.duration || (p.durationMinutes ? `${p.durationMinutes} mins` : '1.5 - 2 hrs'),
            samagri: Number(p.samagri || p.samagriComboPrice || 600),
            bestDay: p.bestDay || 'Auspicious Muhurat',
            suitableFor: p.suitableFor || 'Family, Home & Business',
            desc: p.desc || p.description || 'Conducted by certified Vedic pandits.',
            image: getPoojaImage(p),
          }));
          setPoojas(mapped);
        } else {
          setPoojas([]);
        }
      })
      .catch((err) => {
        console.log('Error loading poojas from backend:', err?.message);
        setPoojas([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPoojas = poojas.filter((p) => {
    if (!p || !p.name) return false;
    const matchesCat =
      selectedCat === 'All' ||
      (p.category && p.category.toLowerCase() === selectedCat.toLowerCase());
    const matchesSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q.toLowerCase())) ||
      (p.tagline && p.tagline.toLowerCase().includes(q.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF4E8" translucent={false} />

      {/* 1. HEADER (MATCHING SCREEN 4) */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#6A141D" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Pooja Booking</Text>
          <Text style={s.headerSubtitle}>Choose from our sacred poojas</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* 2. SEARCH BAR */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={19} color="#8C7A68" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search for pooja..."
          placeholderTextColor="#A59282"
          value={q}
          onChangeText={setQ}
        />
        {q ? (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color="#8C7A68" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 3. CATEGORY PILLS (MATCHING SCREEN 4: 'All' in filled deep maroon) */}
      <View style={s.catsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {CATEGORIES.map((c) => {
            const isActive = selectedCat === c;
            return (
              <TouchableOpacity
                key={c}
                style={[s.catPill, isActive && s.catPillActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedCat(c)}
              >
                <Text style={[s.catPillText, isActive && s.catPillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. SACRED POOJA LIST CARDS */}
      <ScrollView
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6A141D" />
            <Text style={{ marginTop: 12, color: '#8C7A68', fontSize: 13 }}>
              Loading sacred poojas...
            </Text>
          </View>
        ) : filteredPoojas.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={44} color="#8C7A68" />
            <Text style={{ marginTop: 12, color: '#2E1308', fontSize: 16, fontWeight: '700' }}>
              No Poojas Found
            </Text>
            <Text style={{ marginTop: 4, color: '#8C7A68', fontSize: 13 }}>
              Try selecting another category or searching with a different term.
            </Text>
          </View>
        ) : (
          filteredPoojas.map((pooja, idx) => (
            <TouchableOpacity
              key={String(pooja.id || `pooja-${idx}`)}
              style={s.poojaItemCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('PoojaDetail', { pooja })}
            >
              <View style={s.poojaIconBox}>
                <Image source={pooja.image || getPoojaImage(pooja)} style={s.poojaIconImg} resizeMode="contain" />
              </View>

              <View style={s.poojaInfo}>
                <Text style={s.poojaTitle} numberOfLines={1}>
                  {pooja.name}
                </Text>
                <Text style={s.poojaSub} numberOfLines={1}>
                  {pooja.tagline}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#8C7A68" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF4E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FAF4E8',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE3D5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E1308',
    fontFamily: serif,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#8C7A68',
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2E1308',
    padding: 0,
  },
  catsContainer: {
    marginVertical: 14,
  },
  catPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: '#6A141D',
    borderColor: '#6A141D',
  },
  catPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B5749',
  },
  catPillTextActive: {
    color: '#FAF4E8',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  poojaItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  poojaIconBox: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: '#F1E3D3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginRight: 12,
  },
  poojaIconImg: {
    width: '100%',
    height: '100%',
  },
  poojaInfo: {
    flex: 1,
  },
  poojaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1308',
    marginBottom: 4,
  },
  poojaSub: {
    fontSize: 12,
    color: '#8C7A68',
  },
});
