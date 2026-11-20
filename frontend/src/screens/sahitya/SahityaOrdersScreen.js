import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif } from '../../theme/styles';
import { sahityaTheme as th } from '../../theme/sahityaTheme';
import { sahityaStore } from '../../services/sahityaStore';

export default function SahityaOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Successful' | 'Pending' | 'Failed'
  const [orders, setOrders] = useState(sahityaStore.orders);

  useEffect(() => {
    const unsub = sahityaStore.subscribe(() => {
      setOrders([...sahityaStore.orders]);
    });
    return unsub;
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'All') return true;
    return o.status === activeFilter;
  });

  const handleViewInvoice = (order) => {
    Alert.alert(
      'सदस्यता रसीद (Invoice)',
      `ऑर्डर आईडी: ${order.orderId}\nयोजना: ${order.planName}\nराशि: ₹${order.amount}\nभुगतान माध्यम: ${order.paymentMethod}\nलेनदेन संदर्भ: ${order.transactionRef}\nतारीख: ${order.date}\nस्थिति: ${order.status}`,
      [{ text: 'रसीद डाउनलोड करें' }, { text: 'बंद करें', style: 'cancel' }]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Successful':
        return { bg: '#DCFCE7', text: '#15803D', label: 'सफल (Success)' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#B45309', label: 'प्रक्रियाधीन (Pending)' };
      case 'Failed':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'विफल (Failed)' };
      case 'Refunded':
        return { bg: '#F3E8FF', text: '#7E22CE', label: 'वापस (Refunded)' };
      default:
        return { bg: '#E2E8F0', text: '#475569', label: status };
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

        <Text style={s.headerTitle}>खरीद इतिहास (Orders)</Text>

        <View style={s.headerBtn} />
      </View>

      {/* FILTER TABS */}
      <View style={s.filterRow}>
        {[
          { key: 'All', label: 'सभी' },
          { key: 'Successful', label: 'सफल' },
          { key: 'Pending', label: 'लंबित' },
          { key: 'Failed', label: 'विफल' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterPill, activeFilter === f.key && s.filterPillActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="receipt-text-outline" size={56} color={th.secondaryText} />
            <Text style={s.emptyTitle}>कोई ऑर्डर नहीं मिला</Text>
            <Text style={s.emptySub}>इस श्रेणी में कोई भुगतान लेनदेन उपलब्ध नहीं है।</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <View key={order.orderId} style={s.orderCard}>
                <View style={s.orderHeader}>
                  <View>
                    <Text style={s.orderIdText}>{order.orderId}</Text>
                    <Text style={s.orderDateText}>{order.date}</Text>
                  </View>

                  <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.statusText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={s.divider} />

                <View style={s.orderBody}>
                  <View style={s.iconTitleRow}>
                    <MaterialCommunityIcons name="crown" size={20} color={th.saffron} />
                    <Text style={s.planNameText}>{order.planName}</Text>
                  </View>

                  <View style={s.infoGrid}>
                    <View style={s.infoCol}>
                      <Text style={s.infoLabel}>भुगतान राशि</Text>
                      <Text style={s.infoVal}>₹{order.amount}</Text>
                    </View>
                    <View style={s.infoCol}>
                      <Text style={s.infoLabel}>माध्यम</Text>
                      <Text style={s.infoVal} numberOfLines={1}>
                        {order.paymentMethod}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.txnRefText}>Txn Ref: {order.transactionRef}</Text>
                </View>

                <View style={s.divider} />

                <View style={s.orderFooter}>
                  <TouchableOpacity
                    style={s.invoiceBtn}
                    onPress={() => handleViewInvoice(order)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text-outline" size={16} color={th.primary} />
                    <Text style={s.invoiceBtnText}>रसीद देखें (Invoice)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F3E7D3',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: th.primary,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: th.secondaryText,
  },
  filterTextActive: {
    color: '#FFF5E5',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFAF1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: th.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: th.text,
  },
  orderDateText: {
    fontSize: 11.5,
    color: th.secondaryText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E7D3',
    marginVertical: 10,
  },
  orderBody: {},
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: th.primary,
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11.5,
    color: th.secondaryText,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: th.text,
    marginTop: 2,
  },
  txnRefText: {
    fontSize: 11,
    color: '#8C7D73',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  invoiceBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: th.primary,
    marginLeft: 4,
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
});
