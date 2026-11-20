import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/ui';
import colors from '../../theme/colors';
import { radius, shadow, serif } from '../../theme/styles';
import { BookingService, StoreService } from '../../services/api';
import { panditBookingStore } from '../../services/panditBookingStore';

const ALL_TABS = ['All', 'Active', 'Completed', 'Darshan', 'Orders'];

const formatStatusMeta = (rawStatus) => {
  const s = String(rawStatus || 'Pending').toUpperCase();
  if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'DONE') {
    return { label: 'Completed', color: '#1E8E4A', bucket: 'completed' };
  }
  if (s === 'CANCELLED' || s === 'CANCELLED_BY_YAJMAN' || s === 'CANCELLED_BY_PANDIT') {
    return { label: 'Cancelled', color: '#D13939', bucket: 'completed' };
  }
  if (s === 'IN_PROGRESS' || s === 'POOJA_STARTED' || s === 'STARTED') {
    return { label: 'In Progress', color: '#D48B28', bucket: 'active' };
  }
  if (s === 'ARRIVED') {
    return { label: 'Pandit Arrived', color: '#15803D', bucket: 'active' };
  }
  if (s === 'ON_THE_WAY' || s === 'EN_ROUTE') {
    return { label: 'On The Way', color: '#B45309', bucket: 'active' };
  }
  if (s === 'ACCEPTED' || s === 'CONFIRMED') {
    return { label: 'Confirmed', color: '#1E8E4A', bucket: 'active' };
  }
  if (s === 'SEARCHING' || s === 'PENDING_ACCEPTANCE' || s === 'PENDING') {
    return { label: 'Searching', color: '#D48B28', bucket: 'active' };
  }
  return { label: rawStatus || 'Pending', color: colors.saffron, bucket: 'active' };
};

const normalizeRecord = (raw, sourceKind = 'Pooja') => {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw._id || raw.bookingId || raw.orderId || '');
  const meta = formatStatusMeta(raw.status);
  const rawType = String(raw.serviceType || raw.type || sourceKind).toLowerCase();
  const displayType = rawType.includes('darshan')
    ? 'Darshan'
    : rawType.includes('order') || sourceKind === 'Orders'
    ? 'Orders'
    : 'Pooja';

  const title =
    raw.pooja?.name ||
    raw.poojaName ||
    raw.ritualName ||
    raw.title ||
    raw.name ||
    raw.templeName ||
    (displayType === 'Orders' ? 'Samagri Store Order' : 'Vedic Pooja');

  const dateText =
    raw.scheduledAt ||
    (raw.scheduledDate ? `${raw.scheduledDate}${raw.scheduledTime ? ` • ${raw.scheduledTime}` : ''}` : null) ||
    raw.date ||
    (raw.createdAt ? new Date(raw.createdAt).toLocaleDateString('en-IN') : 'Recent');

  const amount = Number(
    raw.totalAmount ?? raw.total ?? raw.amount ?? raw.dakshina ?? raw.serviceCharge ?? 0
  );

  return {
    id: id || `${displayType}-${title}-${dateText}`,
    rawId: id,
    raw,
    title,
    displayType,
    dateText,
    amount: Number.isFinite(amount) ? amount : 0,
    statusLabel: meta.label,
    statusColor: meta.color,
    bucket: meta.bucket,
    rawStatus: String(raw.status || '').toUpperCase(),
    panditName: raw.assignedVendor?.name || raw.vendor?.name || raw.pandit?.name || null,
    isUrgent: String(raw.bookingType || '').toUpperCase() === 'URGENT',
  };
};

export default function MyBookingsScreen({ navigation, route }) {
  const isHistoryMode =
    route?.name === 'History' || route?.params?.filter === 'completed';

  const [tab, setTab] = useState(isHistoryMode ? 'Completed' : 'All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading((prev) => prev && items.length === 0);

    try {
      const mergedMap = new Map();
      const addItem = (norm, isFromServer = false) => {
        if (!norm) return;
        const existing = mergedMap.get(norm.id);
        if (!existing || isFromServer || norm.bucket !== 'active' || existing.rawStatus === 'SEARCHING') {
          mergedMap.set(norm.id, norm);
        }
      };

      // 1. Live active & persisted local bookings
      const activeLocal = panditBookingStore.getBooking();
      if (activeLocal) addItem(normalizeRecord(activeLocal, 'Pooja'));
      (panditBookingStore.getHistory() || []).forEach((h) =>
        addItem(normalizeRecord(h, 'Pooja'))
      );

      // 2. Server bookings & active booking & orders
      const [srvBookingsRes, srvActiveRes, srvOrdersRes] = await Promise.allSettled([
        BookingService.mine(),
        BookingService.active(),
        StoreService.mine(),
      ]);

      if (srvActiveRes.status === 'fulfilled' && srvActiveRes.value) {
        addItem(normalizeRecord(srvActiveRes.value, 'Pooja'), true);
      }
      if (srvBookingsRes.status === 'fulfilled' && Array.isArray(srvBookingsRes.value)) {
        srvBookingsRes.value.forEach((b) => addItem(normalizeRecord(b, 'Pooja'), true));
      }
      if (srvOrdersRes.status === 'fulfilled') {
        const ordRaw = srvOrdersRes.value;
        const ordArr = Array.isArray(ordRaw)
          ? ordRaw
          : Array.isArray(ordRaw?.orders)
          ? ordRaw.orders
          : Array.isArray(ordRaw?.data)
          ? ordRaw.data
          : [];
        ordArr.forEach((o) => addItem(normalizeRecord(o, 'Orders'), true));
      }

      const list = Array.from(mergedMap.values()).sort((a, b) => {
        const ta = new Date(a?.raw?.updatedAt || a?.raw?.completedAt || a?.raw?.createdAt || 0).getTime() || 0;
        const tb = new Date(b?.raw?.updatedAt || b?.raw?.completedAt || b?.raw?.createdAt || 0).getTime() || 0;
        return tb - ta;
      });
      setItems(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [items.length]);

  useFocusEffect(
    useCallback(() => {
      loadBookings(false);
    }, [loadBookings])
  );

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (tab === 'All') return true;
      if (tab === 'Active') return b.bucket === 'active';
      if (tab === 'Completed') return b.bucket === 'completed';
      return b.displayType === tab;
    });
  }, [items, tab]);

  const handlePressCard = (item) => {
    if (item.displayType === 'Orders') {
      navigation.navigate('OrderTracking', { orderId: item.rawId || item.id, order: item.raw });
      return;
    }
    panditBookingStore.hydrateFromServer(item.raw);
    if (item.rawStatus === 'SEARCHING' || item.rawStatus === 'PENDING_ACCEPTANCE') {
      navigation.navigate('Searching', {
        bookingId: item.rawId || item.id,
        booking: item.raw,
      });
    } else {
      navigation.navigate('BookingStatus', {
        bookingId: item.rawId || item.id,
        booking: item.raw,
        fromHistory: item.bucket === 'completed',
      });
    }
  };

  const showBack = route?.name !== 'Bookings' && route?.name !== 'History';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header
        title={isHistoryMode ? 'Booking History' : 'My Bookings'}
        navigation={navigation}
        showBack={showBack}
      />

      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {ALL_TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && s.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor={colors.primary}
          />
        }
      >
        {loading && filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.empty}>Loading your bookings...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={colors.textMuted} />
            <Text style={s.empty}>No {tab === 'All' ? '' : `${tab.toLowerCase()} `}bookings found.</Text>
            <TouchableOpacity
              style={s.bookNowBtn}
              onPress={() => navigation.navigate('PujaBrowse')}
            >
              <Text style={s.bookNowText}>Explore & Book Pooja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((b) => (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.88}
              style={s.card}
              onPress={() => handlePressCard(b)}
            >
              <View style={s.icon}>
                <MaterialCommunityIcons
                  name={
                    b.displayType === 'Orders'
                      ? 'package-variant-closed'
                      : b.displayType === 'Darshan'
                      ? 'temple-hindu'
                      : 'bookmark-check'
                  }
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[s.title, { flex: 1 }]} numberOfLines={1}>
                    {b.title}
                  </Text>
                  {b.isUrgent && (
                    <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#B45309' }}>⚡ Urgent</Text>
                    </View>
                  )}
                </View>
                <Text style={s.meta} numberOfLines={1}>
                  {b.displayType} · {b.dateText}
                </Text>
                {b.panditName ? (
                  <Text style={s.panditText} numberOfLines={1}>
                    Pandit: {b.panditName}
                  </Text>
                ) : null}
                {b.amount > 0 ? (
                  <Text style={s.amount}>₹{b.amount.toLocaleString('en-IN')}</Text>
                ) : null}
              </View>
              <View style={s.rightCol}>
                <View style={[s.badge, { backgroundColor: b.statusColor + '1A' }]}>
                  <Text style={[s.badgeText, { color: b.statusColor }]}>{b.statusLabel}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  tabsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    marginRight: 8,
    backgroundColor: '#F9F3EA',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: serif,
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  panditText: {
    fontSize: 12,
    color: '#5D4037',
    marginTop: 2,
    fontWeight: '600',
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  bookNowBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookNowText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
