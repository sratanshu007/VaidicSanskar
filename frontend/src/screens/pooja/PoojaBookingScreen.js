import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { serif } from '../../theme/styles';
import { panditBookingStore } from '../../services/panditBookingStore';
import { useAuth } from '../../context/AppContext';
import { getCurrentUserLocation } from '../../services/mapplsService';

const TIME_SLOTS = [
  '08:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM',
];

export default function PoojaBookingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, addresses = [], addAddress, updateAddress, deleteAddress } = useAuth();

  const pooja = route?.params?.pooja || {
    id: 'satyanarayan',
    name: 'Satyanarayan Pooja',
    price: 2500,
    samagri: 600,
  };
  const withSamagri = route?.params?.withSamagri !== false;
  const totalAmount = route?.params?.totalPrice || (withSamagri ? 2500 : 1900);

  // Generate upcoming dates strictly starting from Tomorrow (Today & previous dates disallowed)
  const allAvailableDates = useMemo(() => {
    const list = [];
    const baseDate = new Date();
    // Start strictly from tomorrow (i = 1), avoiding today (i = 0) and past dates
    for (let i = 1; i <= 28; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const fullMonth = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      const iso = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
      list.push({
        id: iso,
        date: dateNum,
        day: dayName,
        monthName,
        fullMonth,
        year,
        fullDateString: `${dateNum} ${monthName} ${year}`,
        isTomorrow: i === 1,
      });
    }
    return list;
  }, []);

  // 7 days window with pagination (weekOffset = 0 is Tomorrow's week)
  const [weekOffset, setWeekOffset] = useState(0);
  const visibleDays = useMemo(() => {
    const start = weekOffset * 7;
    return allAvailableDates.slice(start, start + 7);
  }, [allAvailableDates, weekOffset]);

  // Current Month Label for visible week
  const currentMonthLabel = useMemo(() => {
    if (!visibleDays.length) return '';
    const first = visibleDays[0];
    const last = visibleDays[visibleDays.length - 1];
    if (first.monthName === last.monthName) {
      return `${first.monthName} ${first.year}`;
    }
    if (first.year === last.year) {
      return `${first.monthName} - ${last.monthName} ${first.year}`;
    }
    return `${first.monthName} ${first.year} - ${last.monthName} ${last.year}`;
  }, [visibleDays]);

  // Default selection is Tomorrow (the very first available slot!)
  const [selectedDateItem, setSelectedDateItem] = useState(allAvailableDates[0]);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');

  // Compute full list of saved addresses (with fallback to default if user has none)
  const savedAddressList = useMemo(() => {
    let list = [];
    if (Array.isArray(addresses) && addresses.length > 0) {
      list = [...addresses];
    } else if (Array.isArray(user?.addresses) && user.addresses.length > 0) {
      list = [...user.addresses];
    } else {
      const initialLine = user?.address || 'Kanpur';
      const initialCity = user?.city || 'Kanpur';
      const initialPin = user?.pincode || '208019';
      list = [
        {
          id: 'addr_default_1',
          label: 'Home',
          line: initialLine,
          city: initialCity,
          pin: initialPin,
          landmark: user?.landmark || '',
        },
      ];
    }
    return list;
  }, [addresses, user]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Active address is the selected one or the first in the list
  const activeAddress = useMemo(() => {
    if (selectedAddressId) {
      const found = savedAddressList.find((a) => a.id === selectedAddressId);
      if (found) return found;
    }
    return savedAddressList[0] || null;
  }, [selectedAddressId, savedAddressList]);

  // Modal State for Address Selection & Adding/Editing
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalMode, setModalMode] = useState('LIST'); // 'LIST' | 'FORM'
  const [editingAddressId, setEditingAddressId] = useState(null); // null = Add New, id = Edit
  const [modalLine, setModalLine] = useState('');
  const [modalArea, setModalArea] = useState('');
  const [modalPin, setModalPin] = useState('');
  const [modalLandmark, setModalLandmark] = useState('');
  const [modalLabel, setModalLabel] = useState('Home');
  const [fetchingGps, setFetchingGps] = useState(false);

  const openAddressSelectionModal = () => {
    setModalMode('LIST');
    setShowAddressModal(true);
  };

  const openAddNewAddressModal = () => {
    setEditingAddressId(null);
    setModalLine('');
    setModalArea(user?.city || 'Kanpur');
    setModalPin(user?.pincode || '');
    setModalLandmark('');
    setModalLabel('Home');
    setModalMode('FORM');
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr) => {
    const target = addr || activeAddress;
    if (!target) {
      openAddNewAddressModal();
      return;
    }
    setEditingAddressId(target.id);
    setModalLine(target.line || '');
    setModalArea(target.city || '');
    setModalPin(target.pin || '');
    setModalLandmark(target.landmark || '');
    setModalLabel(target.label || 'Home');
    setModalMode('FORM');
    setShowAddressModal(true);
  };

  const handleUseCurrentLocation = async () => {
    setFetchingGps(true);
    try {
      const res = await getCurrentUserLocation({ highAccuracy: false, timeoutMs: 7000 });
      if (res?.success && res.coords) {
        const fullAddr = res.coords.formattedAddress || '';
        const city = res.coords.locality || res.coords.city || '';
        const pin = res.coords.pincode || '';

        setModalLine(fullAddr);
        if (city) setModalArea(city);
        if (pin) setModalPin(pin);

        setEditingAddressId(null);
        setModalLabel('Home');
        setModalMode('FORM');
        setShowAddressModal(true);
      } else {
        Alert.alert(
          'Location Notice',
          res?.message || 'Unable to fetch current GPS location. Please enter manually.'
        );
      }
    } catch (e) {
      console.log('GPS error:', e?.message);
      Alert.alert('Location Notice', 'Could not access GPS. Please enter your address manually.');
    } finally {
      setFetchingGps(false);
    }
  };

  const handleSaveModalAddress = () => {
    if (!modalLine.trim()) {
      Alert.alert('Required / आवश्यक है', 'Please enter house / building / street address.');
      return;
    }

    const addrData = {
      label: modalLabel || 'Home',
      line: modalLine.trim(),
      city: modalArea.trim() || 'Kanpur',
      pin: modalPin.trim(),
      landmark: modalLandmark.trim(),
    };

    if (editingAddressId) {
      if (typeof updateAddress === 'function') {
        updateAddress(editingAddressId, addrData);
      }
      setSelectedAddressId(editingAddressId);
    } else {
      const newId = Date.now().toString();
      if (typeof addAddress === 'function') {
        addAddress({
          id: newId,
          ...addrData,
        });
      }
      setSelectedAddressId(newId);
    }

    setShowAddressModal(false);
  };

  const handleDeleteAddress = (addrId) => {
    Alert.alert(
      'Delete Address / पता हटाएं',
      'Are you sure you want to delete this saved address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (typeof deleteAddress === 'function') {
              deleteAddress(addrId);
              if (selectedAddressId === addrId) {
                const remaining = savedAddressList.filter((a) => a.id !== addrId);
                if (remaining.length > 0) {
                  setSelectedAddressId(remaining[0].id);
                }
              }
            }
          },
        },
      ]
    );
  };

  const getAddressIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'home':
        return 'home';
      case 'office':
        return 'briefcase';
      case 'temple':
        return 'sunny';
      default:
        return 'location';
    }
  };

  const handleProceed = () => {
    const addressToUse = activeAddress;
    const addressLineText = addressToUse?.line || '';
    const areaText = addressToUse?.city || 'Kanpur';
    const pinText = addressToUse?.pin || '';
    const landmarkText = addressToUse?.landmark || '';

    const fullAddress = [
      addressLineText.trim(),
      areaText.trim(),
      pinText.trim() ? `PIN: ${pinText.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (!addressLineText.trim()) {
      Alert.alert(
        'Address Required / पता आवश्यक है',
        'Please enter or select the Pooja venue address so Pandit ji can reach you on time.',
        [
          { text: 'Add Address', onPress: openAddNewAddressModal },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    const bookingDateStr = selectedDateItem?.fullDateString || allAvailableDates[0]?.fullDateString;
    const samagriCost = withSamagri ? (pooja.samagri || 600) : 0;
    const dakshinaAmount = withSamagri ? Math.max(0, totalAmount - samagriCost) : totalAmount;

    // Navigate to Screen 9 (Booking Details / Review) without premature store creation
    navigation.navigate('BookingReview', {
      bookingDraft: {
        pooja,
        scheduledDate: bookingDateStr,
        scheduledTime: selectedTime,
        serviceAddress: fullAddress,
        serviceArea: areaText || 'Local Area',
        landmark: landmarkText,
        pincode: pinText,
        samagriPreference: withSamagri ? 'PANDIT_BRINGS' : 'USER_ARRANGES',
        samagriFee: samagriCost,
        serviceCharge: dakshinaAmount,
        totalAmount,
        withSamagri,
      },
      pooja,
      selectedDate: bookingDateStr,
      selectedTime,
      serviceAddress: fullAddress,
      serviceArea: areaText || 'Local Area',
      withSamagri,
      totalAmount,
    });
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF4E8" translucent={false} />

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#6A141D" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Book Your Pooja</Text>
          <Text style={s.headerSubtitle}>{pooja.name}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: SELECT DATE */}
        <View style={s.sectionCard}>
          <View style={s.dateSectionHeaderRow}>
            <Text style={s.sectionTitle}>Select Date</Text>
            <View style={s.tomorrowNoticeBadge}>
              <Ionicons name="calendar-outline" size={12} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={s.tomorrowNoticeText}>From Tomorrow Onwards</Text>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={s.monthRow}>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (weekOffset > 0) setWeekOffset((prev) => prev - 1);
              }}
              disabled={weekOffset === 0}
              style={{ opacity: weekOffset === 0 ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-back" size={18} color="#6A141D" />
            </TouchableOpacity>
            <Text style={s.monthText}>{currentMonthLabel}</Text>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if ((weekOffset + 1) * 7 < allAvailableDates.length) {
                  setWeekOffset((prev) => prev + 1);
                }
              }}
              disabled={(weekOffset + 1) * 7 >= allAvailableDates.length}
              style={{ opacity: (weekOffset + 1) * 7 >= allAvailableDates.length ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-forward" size={18} color="#6A141D" />
            </TouchableOpacity>
          </View>

          {/* Calendar Day Row (Strictly tomorrow onwards, previous dates disallowed) */}
          <View style={s.calendarRow}>
            {visibleDays.map((item) => {
              const isSelected = selectedDateItem?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={s.dayCol}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDateItem(item)}
                >
                  <Text style={[s.dayName, isSelected && s.dayNameActive]}>
                    {item.day}
                  </Text>
                  <View
                    style={[
                      s.dateCircle,
                      isSelected && s.dateCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.dateNumber,
                        isSelected && s.dateNumberActive,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>
                  {item.isTomorrow && (
                    <Text style={s.tomorrowSubTag}>Tomorrow</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={s.dateFooterHint}>
            * पूजा की शुद्ध वैदिक तैयारी हेतु बुकिंग अगले दिन (Next Day) से उपलब्ध है।
          </Text>
        </View>

        {/* SECTION 2: SELECT TIME */}
        <View style={[s.sectionCard, { marginTop: 16 }]}>
          <Text style={s.sectionTitle}>Select Time</Text>

          <View style={s.timeGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[s.timeSlotBtn, isSelected && s.timeSlotBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text
                    style={[
                      s.timeSlotText,
                      isSelected && s.timeSlotTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: POOJA LOCATION / ADDRESS */}
        <View style={[s.sectionCard, { marginTop: 16 }]}>
          <View style={s.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-sharp" size={18} color="#6A141D" style={{ marginRight: 6 }} />
              <Text style={s.sectionTitle}>Pooja Location / Venue</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openAddressSelectionModal}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.actionLink}>Change</Text>
            </TouchableOpacity>
          </View>

          {activeAddress ? (
            <View style={s.addressContentBox}>
              <View style={s.addressInfoRow}>
                <View style={s.locationPinCircle}>
                  <Ionicons name={getAddressIcon(activeAddress.label)} size={16} color="#6A141D" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.addressMainText}>{activeAddress.line}</Text>
                  {(activeAddress.city || activeAddress.pin) ? (
                    <Text style={s.addressSubText}>
                      {[activeAddress.city, activeAddress.pin ? `PIN: ${activeAddress.pin}` : ''].filter(Boolean).join(' • ')}
                    </Text>
                  ) : null}
                  {activeAddress.landmark ? (
                    <Text style={s.landmarkBadgeText}>Landmark: {activeAddress.landmark}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.addressActionsRow}>
                <TouchableOpacity
                  style={s.gpsQuickBtn}
                  activeOpacity={0.8}
                  onPress={handleUseCurrentLocation}
                  disabled={fetchingGps}
                >
                  {fetchingGps ? (
                    <ActivityIndicator size="small" color="#6A141D" />
                  ) : (
                    <>
                      <Ionicons name="navigate-outline" size={14} color="#6A141D" style={{ marginRight: 4 }} />
                      <Text style={s.gpsQuickText}>Use GPS</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.editQuickBtn}
                  activeOpacity={0.8}
                  onPress={() => openEditAddressModal(activeAddress)}
                >
                  <Ionicons name="pencil-outline" size={14} color="#6A141D" style={{ marginRight: 4 }} />
                  <Text style={s.editQuickText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.emptyAddressBox}>
              <View style={s.emptyAddressIconCircle}>
                <Ionicons name="location-outline" size={26} color="#6A141D" />
              </View>
              <Text style={s.emptyAddressTitle}>No Venue Address Added</Text>
              <Text style={s.emptyAddressSub}>
                Please add the address where the pooja will be conducted.
              </Text>
              <View style={s.emptyActionRow}>
                <TouchableOpacity
                  style={s.addAddressBtn}
                  activeOpacity={0.85}
                  onPress={openAddNewAddressModal}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={s.addAddressBtnText}>Add Address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.gpsOutlineBtn}
                  activeOpacity={0.85}
                  onPress={handleUseCurrentLocation}
                  disabled={fetchingGps}
                >
                  {fetchingGps ? (
                    <ActivityIndicator size="small" color="#6A141D" />
                  ) : (
                    <>
                      <Ionicons name="navigate-circle-outline" size={16} color="#6A141D" style={{ marginRight: 6 }} />
                      <Text style={s.gpsOutlineBtnText}>Current GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM STICKY BAR (MATCHING SCREEN 7) */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.priceBox}>
          <Text style={s.totalLabel}>Total Amount</Text>
          <Text style={s.totalValue}>
            ₹ {totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={s.totalSub}>
            {withSamagri ? '(with Samagri + Pandit)' : '(Pandit Dakshina)'}
          </Text>
        </View>

        <TouchableOpacity
          style={s.proceedBtn}
          activeOpacity={0.88}
          onPress={handleProceed}
        >
          <Text style={s.proceedBtnText}>Proceed to Continue</Text>
        </TouchableOpacity>
      </View>

      {/* ADDRESS ENTRY & SELECTION MODAL */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          {modalMode === 'LIST' ? (
            <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={s.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location" size={20} color="#6A141D" style={{ marginRight: 8 }} />
                  <Text style={s.modalTitle}>Choose Pooja Venue</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddressModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#7C6C5E" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 14 }}>
                {savedAddressList.map((addr) => {
                  const isSelected = activeAddress?.id === addr.id;
                  const iconName = getAddressIcon(addr.label);
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      style={[s.addressRowCard, isSelected && s.addressRowCardSelected]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressModal(false);
                      }}
                    >
                      <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                        {isSelected && <View style={s.radioInnerDot} />}
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={iconName} size={14} color="#6A141D" style={{ marginRight: 4 }} />
                          <Text style={s.addressRowLabel}>{addr.label || 'Address'}</Text>
                          {isSelected && (
                            <View style={s.selectedTag}>
                              <Text style={s.selectedTagText}>Selected</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.addressRowLine} numberOfLines={2}>
                          {addr.line}
                        </Text>
                        {(addr.city || addr.pin) ? (
                          <Text style={s.addressRowSub}>
                            {[addr.city, addr.pin ? `PIN: ${addr.pin}` : ''].filter(Boolean).join(' • ')}
                          </Text>
                        ) : null}
                      </View>

                      {savedAddressList.length > 1 && (
                        <TouchableOpacity
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onPress={() => handleDeleteAddress(addr.id)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="trash-outline" size={17} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Add New Address Button */}
                <TouchableOpacity
                  style={s.addNewAddressBtn}
                  activeOpacity={0.85}
                  onPress={openAddNewAddressModal}
                >
                  <Ionicons name="add-circle" size={18} color="#6A141D" style={{ marginRight: 6 }} />
                  <Text style={s.addNewAddressBtnText}>+ Add New Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={s.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setModalMode('LIST')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginRight: 8 }}
                  >
                    <Ionicons name="arrow-back" size={22} color="#6A141D" />
                  </TouchableOpacity>
                  <Text style={s.modalTitle}>
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddressModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#7C6C5E" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Quick GPS Button */}
                <TouchableOpacity
                  style={s.modalGpsRow}
                  activeOpacity={0.85}
                  onPress={handleUseCurrentLocation}
                  disabled={fetchingGps}
                >
                  {fetchingGps ? (
                    <ActivityIndicator size="small" color="#15803D" style={{ marginRight: 10 }} />
                  ) : (
                    <Ionicons name="navigate-circle" size={22} color="#15803D" style={{ marginRight: 10 }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalGpsTitle}>Use Current GPS Location</Text>
                    <Text style={s.modalGpsSub}>Auto-detect your present premises</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#7C6C5E" />
                </TouchableOpacity>

                {/* Tag Selector */}
                <View style={[s.fieldGroup, { marginTop: 14 }]}>
                  <Text style={s.fieldLabel}>Address Type</Text>
                  <View style={s.tagRow}>
                    {[
                      { label: 'Home', icon: 'home' },
                      { label: 'Office', icon: 'briefcase' },
                      { label: 'Temple', icon: 'sunny' },
                      { label: 'Other', icon: 'location' },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.label}
                        style={[s.tagBtn, modalLabel === t.label && s.tagBtnActive]}
                        onPress={() => setModalLabel(t.label)}
                      >
                        <Ionicons
                          name={t.icon}
                          size={12}
                          color={modalLabel === t.label ? '#FFFFFF' : '#6A141D'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[s.tagText, modalLabel === t.label && s.tagTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Form Input: House / Flat / Street */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>House / Flat / Floor / Building *</Text>
                  <TextInput
                    style={s.textInput}
                    value={modalLine}
                    onChangeText={setModalLine}
                    placeholder="e.g. Flat 301, Shree Dham Apt, Sector 15"
                    placeholderTextColor="#A89A8E"
                  />
                </View>

                {/* Form Input: Area / Street */}
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>Locality / Street / City *</Text>
                  <TextInput
                    style={s.textInput}
                    value={modalArea}
                    onChangeText={setModalArea}
                    placeholder="e.g. Civil Lines, Kanpur"
                    placeholderTextColor="#A89A8E"
                  />
                </View>

                {/* Form Input: Pin & Landmark */}
                <View style={s.twoColWrap}>
                  <View style={[s.fieldGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={s.fieldLabel}>PIN Code</Text>
                    <TextInput
                      style={s.textInput}
                      value={modalPin}
                      onChangeText={setModalPin}
                      placeholder="e.g. 208001"
                      placeholderTextColor="#A89A8E"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={[s.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={s.fieldLabel}>Landmark (Optional)</Text>
                    <TextInput
                      style={s.textInput}
                      value={modalLandmark}
                      onChangeText={setModalLandmark}
                      placeholder="Near Temple"
                      placeholderTextColor="#A89A8E"
                    />
                  </View>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={s.modalConfirmBtn}
                  activeOpacity={0.88}
                  onPress={handleSaveModalAddress}
                >
                  <Text style={s.modalConfirmText}>
                    {editingAddressId ? 'Save & Update Address' : 'Save & Select Address'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 12,
    color: '#7C6C5E',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EADBCE',
    padding: 16,
  },
  dateSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tomorrowNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFE7CA',
  },
  tomorrowNoticeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#15803D',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E1308',
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6A141D',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1308',
    marginHorizontal: 16,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 11,
    color: '#7C6C5E',
    marginBottom: 6,
  },
  dayNameActive: {
    color: '#6A141D',
    fontWeight: '700',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: '#6A141D',
  },
  dateNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E1308',
  },
  dateNumberActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tomorrowSubTag: {
    fontSize: 8.5,
    color: '#15803D',
    fontWeight: '700',
    marginTop: 3,
  },
  dateFooterHint: {
    fontSize: 11,
    color: '#8A7B6E',
    marginTop: 10,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeSlotBtn: {
    width: '31%',
    backgroundColor: '#FAF4E8',
    borderWidth: 1,
    borderColor: '#EADBCE',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSlotBtnActive: {
    backgroundColor: '#6A141D',
    borderColor: '#6A141D',
  },
  timeSlotText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2E1308',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addressContentBox: {
    backgroundColor: '#FAF4E8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EADBCE',
    padding: 12,
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E1308',
    lineHeight: 20,
  },
  addressSubText: {
    fontSize: 12,
    color: '#7C6C5E',
    marginTop: 2,
  },
  landmarkBadgeText: {
    fontSize: 11.5,
    color: '#6A141D',
    fontWeight: '600',
    marginTop: 3,
  },
  addressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EADBCE',
  },
  gpsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginRight: 8,
  },
  gpsQuickText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A141D',
  },
  editQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  editQuickText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A141D',
  },
  emptyAddressBox: {
    backgroundColor: '#FAF4E8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EADBCE',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  emptyAddressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyAddressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E1308',
  },
  emptyAddressSub: {
    fontSize: 12,
    color: '#7C6C5E',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 12,
  },
  emptyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A141D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  addAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  gpsOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6A141D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  gpsOutlineBtnText: {
    color: '#6A141D',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EADBCE',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  priceBox: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    color: '#7C6C5E',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E1308',
    marginTop: 1,
  },
  totalSub: {
    fontSize: 10.5,
    color: '#7C6C5E',
  },
  proceedBtn: {
    backgroundColor: '#6A141D',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2E1308',
    fontFamily: serif,
  },
  modalGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F3',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C6E8D2',
  },
  modalGpsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#15803D',
  },
  modalGpsSub: {
    fontSize: 11.5,
    color: '#4B6B55',
    marginTop: 1,
  },
  savedSection: {
    marginTop: 14,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF4E8',
    borderWidth: 1,
    borderColor: '#EADBCE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    maxWidth: 200,
  },
  savedChipText: {
    fontSize: 12,
    color: '#2E1308',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FAF4E8',
    borderWidth: 1,
    borderColor: '#EADBCE',
    marginRight: 8,
  },
  tagBtnActive: {
    backgroundColor: '#6A141D',
    borderColor: '#6A141D',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C6C5E',
  },
  tagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldGroup: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E1308',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAF4E8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EADBCE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#2E1308',
  },
  twoColWrap: {
    flexDirection: 'row',
  },
  modalConfirmBtn: {
    backgroundColor: '#6A141D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  addNewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FAF4E8',
  },
  addressRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF4E8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EADBCE',
    padding: 12,
    marginBottom: 10,
  },
  addressRowCardSelected: {
    backgroundColor: '#FFF9F2',
    borderColor: '#6A141D',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4B5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#6A141D',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6A141D',
  },
  addressRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E1308',
  },
  addressRowLine: {
    fontSize: 13,
    color: '#2E1308',
    marginTop: 2,
    lineHeight: 18,
  },
  addressRowSub: {
    fontSize: 11.5,
    color: '#7C6C5E',
    marginTop: 2,
  },
  selectedTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  selectedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6A141D',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  addNewAddressBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A141D',
  },
});
