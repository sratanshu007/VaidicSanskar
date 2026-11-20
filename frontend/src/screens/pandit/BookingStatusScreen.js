import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Clipboard,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif, shadow } from '../../theme/styles';
import { panditBookingStore } from '../../services/panditBookingStore';
import LiveTrackingMapView from '../../components/LiveTrackingMapView';
import { DEFAULT_COORDS } from '../../services/mapplsService';
import socket from '../../services/socket';
import { API_URL } from '../../config/env';
import { getAuthToken, BookingService } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function BookingStatusScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { showNotification } = useNotification();
  const passedBooking = route?.params?.booking;
  const storeBooking = panditBookingStore.getBooking();
  const passedBookingId = route?.params?.bookingId || passedBooking?.id || passedBooking?._id || storeBooking?.id;
  const [booking, setBooking] = useState(
    () => storeBooking || passedBooking || null
  );
  const [hydrating, setHydrating] = useState(!booking);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Pooja procedure incomplete');
  const [isTrackingStale, setIsTrackingStale] = useState(false);
  const lastLocationUpdateRef = React.useRef(Date.now());
  const isCancellingRef = React.useRef(false);
  const [liveLocation, setLiveLocation] = useState({
    latitude: 28.5520,
    longitude: 77.3780,
    distanceKm: '2.4',
    etaMinutes: '14',
    lastUpdated: 'Just now',
  });

  useEffect(() => {
    let mounted = true;
    const syncFromServer = async () => {
      try {
        if (passedBooking) {
          panditBookingStore.hydrateFromServer(passedBooking);
        }
        const srv = passedBookingId
          ? await BookingService.detail(passedBookingId)
          : await BookingService.active();
        if (mounted && srv) {
          const updated = panditBookingStore.hydrateFromServer(srv);
          if (updated) setBooking({ ...updated });
        } else if (mounted) {
          const curStore = panditBookingStore.getBooking();
          if (curStore) setBooking({ ...curStore });
        }
      } catch (_) {
        if (mounted) {
          const curStore = panditBookingStore.getBooking();
          if (curStore) setBooking({ ...curStore });
        }
      } finally {
        if (mounted) setHydrating(false);
      }
    };
    syncFromServer();

    // 1. Reactive store subscription
    const unsub = panditBookingStore.subscribe((b) => {
      if (mounted) setBooking(b ? { ...b } : null);
      if (b && b.status === 'COMPLETED' && !route?.params?.fromHistory) {
        setTimeout(() => {
          navigation.replace('Review');
        }, 1200);
      }
    });

    // 2. Real-time Socket.IO room connection for live tracking updates
    const bId = booking?.id || passedBookingId;
    if (bId) {
      socket.join(bId);
    }

    const handleLocation = (loc) => {
      if (loc) {
        lastLocationUpdateRef.current = Date.now();
        setIsTrackingStale(false);
        setLiveLocation({
          latitude: Number(loc.vendorLatitude || loc.latitude || 28.5520),
          longitude: Number(loc.vendorLongitude || loc.longitude || 77.3780),
          distanceKm: String(loc.distanceKm != null ? loc.distanceKm : '2.1'),
          etaMinutes: String(loc.etaMinutes != null ? loc.etaMinutes : '12'),
          lastUpdated: 'Live updated',
        });
      }
    };

    // Stale check interval: if no GPS stream for >30 seconds, alert user
    const staleInterval = setInterval(() => {
      if (Date.now() - lastLocationUpdateRef.current > 30000) {
        setIsTrackingStale(true);
      }
    }, 10000);

    const unsubLoc = socket.on('booking:location', handleLocation);
    const unsubTrack = socket.on('tracking:update', handleLocation);
    const unsubVendorLoc = socket.on('vendor:location', handleLocation);

    const unsubEnRoute = socket.on('booking:en_route', () => {
      showNotification({
        title: 'पंडित जी निकल चुके हैं! 🚗',
        message: 'पंडित जी आपके पते की ओर प्रस्थान कर चुके हैं।',
        type: 'pandit',
      });
      panditBookingStore.setOnTheWay();
    });

    const unsubArrived = socket.on('booking:arrived', (data) => {
      const arrivedOtp = data?.startOtp || data?.booking?.startOtp;
      if (arrivedOtp) {
        panditBookingStore.setStartOtp(arrivedOtp);
      } else {
        syncFromServer();
      }
      showNotification({
        title: 'पंडित जी द्वार पर पहुँच गए! 🪔',
        message: 'पंडित जी आपके स्थान पर पहुँच चुके हैं। कृपया उनका स्वागत करें।',
        type: 'pandit',
      });
      panditBookingStore.setArrived(100);
    });

    const unsubCompReq = socket.on('booking:completion_requested', (data) => {
      const compOtp = data?.completeOtp || data?.booking?.completeOtp;
      if (compOtp) {
        panditBookingStore.setCompleteOtp(compOtp);
      } else {
        syncFromServer();
      }
      showNotification({
        title: 'पूजा संपन्न अनुरोध 🌸',
        message: 'पंडित जी ने पूजा समापन का अनुरोध किया है। कृपया समापन OTP साझा करें।',
        type: 'booking',
      });
    });

    const onPoojaStarted = () => {
      showNotification({
        title: 'शुभ पूजा प्रारंभ! 🕉️',
        message: 'वैदिक मंत्रोच्चार के साथ आपकी पूजा आरंभ हो चुकी है।',
        type: 'booking',
      });
      panditBookingStore.setStarted();
    };
    const unsubStarted = socket.on('booking:pooja_started', onPoojaStarted);
    const unsubSrvStarted = socket.on('booking:started', onPoojaStarted);

    const unsubCompleted = socket.on('booking:completed', () => {
      showNotification({
        title: 'पूजा संपन्न हुई! 🙏',
        message: 'आपकी पूजा विधिपूर्वक संपन्न हुई। हर हर महादेव!',
        type: 'success',
      });
      panditBookingStore.setCompleted();
    });

    const unsubInstant = socket.on('instant:update', (data) => {
      if (!data) return;
      const s = String(data.status || '').toLowerCase();
      if (data.startOtp) panditBookingStore.setStartOtp(data.startOtp);
      if (data.completeOtp) panditBookingStore.setCompleteOtp(data.completeOtp);
      if (s === 'on_the_way' || s === 'en_route') panditBookingStore.setOnTheWay();
      if (s === 'arrived') panditBookingStore.setArrived(100);
      if (s === 'in_progress') panditBookingStore.setStarted();
      if (s === 'completed') panditBookingStore.setCompleted();
    });

    return () => {
      unsub();
      unsubLoc();
      unsubTrack();
      unsubVendorLoc();
      unsubEnRoute();
      unsubArrived();
      unsubCompReq();
      unsubStarted();
      unsubSrvStarted();
      unsubCompleted();
      unsubInstant();
      clearInterval(staleInterval);
      if (socket && bId) socket.leave(bId);
    };
  }, [navigation, passedBookingId, booking?.id, booking?.startOtp, booking?.completeOtp]);

  if (!booking) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        {hydrating ? (
          <>
            <ActivityIndicator size="large" color="#67101F" />
            <Text style={[s.subText, { marginTop: 12 }]}>Loading live booking status...</Text>
          </>
        ) : (
          <>
            <Text style={s.subText}>No active booking found</Text>
            <TouchableOpacity style={s.rebookBtn} onPress={() => navigation.navigate('PujaBrowse')}>
              <Text style={s.rebookBtnText}>Book a Pooja</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  const status = booking?.status || 'ACCEPTED';
  const pandit = booking?.pandit || booking?.assignedVendor || booking?.vendor || {
    name: 'Verified Pandit',
    experienceYears: 5,
    rating: '4.9',
    reviewsCount: 42,
  };
  const pooja = booking?.pooja || {
    name: booking?.ritualName || booking?.poojaName || booking?.title || 'वैदिक पूजा',
    price: booking?.dakshina || booking?.totalAmount || booking?.amount || 2500,
  };

  // Format Elapsed Time (hh:mm:ss)
  const formatTimer = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const copyToClipboard = (code) => {
    try {
      if (Clipboard && typeof Clipboard.setString === 'function') {
        Clipboard.setString(code);
      }
    } catch (_) { }
    Alert.alert('Copied', `OTP ${code} copied to clipboard.`);
  };

  const handleCancelBooking = () => {
    let feeNotice = '100% पूरा रिफंड आपके मूल खाते में वापस कर दिया जाएगा।';
    if (status === 'ON_THE_WAY') {
      feeNotice = 'पंडित जी आपके पते के लिए निकल चुके हैं। ₹100 यात्रा भत्ता काटा जाएगा।';
    } else if (status === 'ARRIVED') {
      feeNotice = 'पंडित जी आपके पते पर पहुँच चुके हैं। 50% दक्षिणा पंडित जी को देय होगी।';
    } else if (status === 'IN_PROGRESS') {
      return Alert.alert(
        'पूजा प्रगति पर है (In Progress)',
        'वैदिक संकल्प आरंभ हो चुका है, अतः पूजा बीच में रद्द नहीं की जा सकती। किसी भी समस्या के लिए सहायता (Dispute) विकल्प चुनें।'
      );
    }

    Alert.alert(
      'पूजा रद्द करें?',
      feeNotice,
      [
        { text: 'बुकिंग रखें', style: 'cancel' },
        {
          text: 'रद्द करें',
          style: 'destructive',
          onPress: () => {
            isCancellingRef.current = true;
            const bId = booking?.id || passedBookingId;
            if (bId) {
              const cancelPayload = {
                id: bId,
                bookingId: bId,
                job_id: bId,
                status: 'CANCELLED',
                cancelledBy: 'yajman',
                reason: 'User cancelled active booking',
              };
              socket.emit('booking:cancelled', cancelPayload);
              socket.emit('booking:cancel', cancelPayload);
              socket.emit('job:cancel', cancelPayload);
              socket.emit('instant:cancel', cancelPayload);
              socket.emit('instant:update', cancelPayload);
              socket.leave(bId);
            }
            const res = panditBookingStore.cancelBooking('yajman', 'User cancelled active booking');
            panditBookingStore.reset();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
        },
      ]
    );
  };

  const handleDisputeSubmit = () => {
    panditBookingStore.raiseDispute(disputeReason, 'Dispute raised by customer');
    setShowDisputeModal(false);
    Alert.alert(
      'Dispute Registered',
      'Our Vedic Support Team has been notified and will reach out to you within 15 minutes.'
    );
  };

  // State step indices: ACCEPTED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED
  const isEnRoute = status === 'ON_THE_WAY';
  const isArrived = status === 'ARRIVED';
  const isInProgress = status === 'IN_PROGRESS';
  const isCompleted = status === 'COMPLETED';

  // Strictly prevent backing out of active accepted booking via buttons or gestures
  useEffect(() => {
    const onBackPress = () => {
      if (isCompleted || isCancellingRef.current) {
        return false;
      }
      handleCancelBooking();
      return true; // Blocks default back action
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    const unsubBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      if (isCompleted || isCancellingRef.current) {
        return;
      }
      e.preventDefault();
      handleCancelBooking();
    });

    return () => {
      backSub.remove();
      unsubBeforeRemove();
    };
  }, [navigation, status, isCompleted]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF5EE" translucent={false} />

      {/* TOP HEADER */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={s.backCircle}
          onPress={handleCancelBooking}
          hitSlop={10}
        >
          <Ionicons name="close" size={22} color="#67101F" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.screenTitle}>
            {isCompleted ? 'Pooja Completed' : isEnRoute ? 'Pandit on the Way' : isArrived ? 'Pandit Has Arrived' : isInProgress ? 'Pooja in Progress' : 'Booking Confirmed'}
          </Text>
          <Text style={s.screenSub}>#{booking.id} · {pooja?.name || booking.ritualName || booking.poojaName || booking.title || 'Vaidic Pooja'}</Text>
        </View>
        <TouchableOpacity style={s.helpBtn} onPress={() => setShowDisputeModal(true)}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#D48B28" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SCREEN 7: LIVE TRACKING MAP (When En Route or Arrived) */}
        {(isEnRoute || isArrived) && (
          <View style={s.mapWrapper}>
            <LiveTrackingMapView
              userLocation={{
                latitude: booking.latitude || DEFAULT_COORDS.latitude,
                longitude: booking.longitude || DEFAULT_COORDS.longitude,
              }}
              panditLocation={{
                latitude: liveLocation.latitude,
                longitude: liveLocation.longitude,
              }}
              distanceKm={liveLocation.distanceKm}
              etaMinutes={liveLocation.etaMinutes}
              isStale={isTrackingStale}
            />

            {/* Floating ETA Overlay Pill */}
            <View style={s.mapFloatingCard}>
              <View style={s.mapFloatingRow}>
                <View style={s.etaPill}>
                  <Ionicons name="navigate-circle" size={16} color="#67101F" />
                  <Text style={s.etaText}>
                    {isArrived ? 'PANDIT HAS REACHED' : `ETA: ${liveLocation.etaMinutes} MINS`}
                  </Text>
                </View>
                <Text style={s.distText}>
                  {isArrived ? 'At your door' : `${liveLocation.distanceKm} km away`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* UPCOMING ADVANCE SCHEDULE VIEW (When Accepted and Journey Not Started) */}
        {status === 'ACCEPTED' && (
          <View style={s.upcomingScheduleCard}>
            <View style={s.upcomingHeaderRow}>
              <View style={s.upcomingCalendarIcon}>
                <Ionicons name="calendar" size={24} color="#67101F" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.upcomingTitle}>Auspicious Pooja Scheduled</Text>
                <Text style={s.upcomingDateText}>
                  {booking.scheduledAt || (booking.scheduledDate ? `${booking.scheduledDate}${booking.scheduledTime ? ` • ${booking.scheduledTime}` : ''}` : 'Scheduled')}
                </Text>
              </View>
              <View style={booking.bookingType === 'URGENT' ? s.urgentBadge : s.normalBadge}>
                <Text style={booking.bookingType === 'URGENT' ? s.urgentBadgeText : s.normalBadgeText}>
                  {booking.bookingType === 'URGENT' ? '⚡ Urgent' : 'Plan Ahead'}
                </Text>
              </View>
            </View>

            <View style={s.upcomingTrackingNoticeBox}>
              <Ionicons name="information-circle" size={18} color="#D48B28" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={s.upcomingTrackingNoticeText}>
                Live GPS tracking will activate on the pooja day when Pandit Ji begins journey.
                {'\n'}(लाइव ट्रैकिंग पूजा के दिन पंडित जी के प्रस्थान करते ही चालू होगी।)
              </Text>
            </View>
          </View>
        )}

        {/* PROGRESS STEP BAR */}
        <View style={s.statusCard}>
          <View style={s.stepRow}>
            <View style={[s.stepCircle, s.stepDone]}>
              <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
            </View>
            <View style={[s.stepLine, (isEnRoute || isArrived || isInProgress || isCompleted) && s.stepLineDone]} />
            <View style={[s.stepCircle, (isEnRoute || isArrived || isInProgress || isCompleted) && s.stepDone]}>
              <MaterialCommunityIcons name="moped" size={13} color="#FFFFFF" />
            </View>
            <View style={[s.stepLine, (isArrived || isInProgress || isCompleted) && s.stepLineDone]} />
            <View style={[s.stepCircle, (isArrived || isInProgress || isCompleted) && s.stepDone]}>
              <MaterialCommunityIcons name="map-marker-check" size={13} color="#FFFFFF" />
            </View>
            <View style={[s.stepLine, (isInProgress || isCompleted) && s.stepLineDone]} />
            <View style={[s.stepCircle, (isInProgress || isCompleted) && s.stepDone]}>
              <MaterialCommunityIcons name="fire" size={13} color="#FFFFFF" />
            </View>
          </View>

          <View style={s.statusLabelRow}>
            <Text style={s.statusMainText}>
              {status === 'ACCEPTED' && 'Pandit Assigned · Preparing for Departure'}
              {isEnRoute && 'Pandit is On The Way to Your Address'}
              {isArrived && 'Your Pandit Has Arrived at Your Doorstep'}
              {isInProgress && 'Pooja in Progress (शुभ पूजा प्रारंभ)'}
              {isCompleted && 'Pooja Completed Auspiciously'}
            </Text>
            <Text style={s.statusSubText}>
              {status === 'ACCEPTED' && 'Pandit is gathering certified samagri and will begin journey shortly.'}
              {isEnRoute && `Live tracking active · Remaining road distance: ${liveLocation.distanceKm} km`}
              {isArrived && 'Please share the Start OTP below with the Pandit to begin the ritual.'}
              {isInProgress && 'Vedic mantras and sankalpa in progress. Share Completion OTP when finished.'}
              {isCompleted && 'Service finished with full rituals. Please rate and review your experience.'}
            </Text>
          </View>
        </View>

        {/* SCREEN 11: START OTP CARD (Delivered upon arrival confirmation) */}
        {isArrived && (
          <View style={s.otpCard}>
            <View style={s.otpHeader}>
              <MaterialCommunityIcons name="shield-key" size={24} color="#D48B28" />
              <Text style={s.otpCardTitle}>START OF POOJA OTP</Text>
            </View>
            <Text style={s.otpInstruction}>
              Your pandit has arrived. Share this 4-digit code to verify and begin the sacred ritual:
            </Text>

            <View style={s.otpDigitsRow}>
              {String(booking?.startOtp || '----').split('').map((digit, idx) => (
                <View key={idx} style={s.otpBox}>
                  <Text style={s.otpDigit}>{digit}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={s.copyBtn} onPress={() => booking?.startOtp && copyToClipboard(String(booking.startOtp))}>
              <MaterialCommunityIcons name="content-copy" size={15} color="#67101F" />
              <Text style={s.copyBtnText}>Copy OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCREEN 12 & 13: POOJA IN PROGRESS & COMPLETION OTP */}
        {isInProgress && (
          <View style={[s.otpCard, { borderColor: '#15803D' }]}>
            <View style={s.timerRow}>
              <View style={s.liveTimerPill}>
                <View style={s.liveDot} />
                <Text style={s.timerLabel}>POOJA IN PROGRESS</Text>
              </View>
              <Text style={s.timerDigits}>{formatTimer(booking.elapsedSeconds)}</Text>
            </View>

            <View style={[s.otpHeader, { marginTop: 14 }]}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#15803D" />
              <Text style={[s.otpCardTitle, { color: '#15803D' }]}>
                POOJA COMPLETION OTP
              </Text>
            </View>
            <Text style={s.otpInstruction}>
              Share this completion code with the pandit ONLY after all mantras and havan are fully completed:
            </Text>

            <View style={s.otpDigitsRow}>
              {String(booking?.completeOtp || '----').split('').map((digit, idx) => (
                <View key={idx} style={[s.otpBox, { borderColor: '#15803D', backgroundColor: '#F0FDF4' }]}>
                  <Text style={[s.otpDigit, { color: '#15803D' }]}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SCREEN 6: ASSIGNED PANDIT PROFILE (NO PERSONAL PHONE NUMBER) */}
        {pandit && (
          <View style={s.panditCard}>
            <View style={s.panditRow}>
              <Image
                source={require('../../../assets/profile_krishna_avatar.png')}
                style={s.panditAvatar}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.panditName}>{pandit.name || 'Verified Pandit'}</Text>
                  <MaterialCommunityIcons name="check-decagram" size={17} color="#15803D" style={{ marginLeft: 4 }} />
                </View>
                <Text style={s.panditGurukul} numberOfLines={1}>
                  {pandit.gurukul || 'Sampurnanand Sanskrit Vishwavidyalaya'}
                </Text>
                <View style={s.ratingRow}>
                  <Ionicons name="star" size={13} color="#D48B28" />
                  <Text style={s.ratingStar}>{pandit.rating || '0.0'}</Text>
                  <Text style={s.ratingCount}>({pandit.reviewsCount || 0} reviews)</Text>
                  <Text style={s.dotSep}>•</Text>
                  <Text style={s.expText}>{pandit.experienceYears || '0'} yrs exp</Text>
                </View>
              </View>
            </View>

            {/* SECURE IN-APP ACTIONS: CHAT & MASKED CALL (PHONE PRIVACY PROTECTED) */}
            <View style={s.contactRow}>
              <TouchableOpacity
                style={s.chatBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Chat', { name: pandit.name })}
              >
                <MaterialCommunityIcons name="message-text-outline" size={18} color="#67101F" />
                <Text style={s.chatBtnText}>In-App Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.callBtn}
                activeOpacity={0.85}
                onPress={() => setShowCallModal(true)}
              >
                <MaterialCommunityIcons name="phone-lock" size={18} color="#FFFFFF" />
                <Text style={s.callBtnText}>Masked Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SERVICE SUMMARY CARD */}
        <View style={s.detailsCard}>
          <Text style={s.detailsCardTitle}>Booking Summary & Location</Text>
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Booking Type:</Text>
            <View style={booking.bookingType === 'URGENT' ? s.urgentBadge : s.normalBadge}>
              <Text style={booking.bookingType === 'URGENT' ? s.urgentBadgeText : s.normalBadgeText}>
                {booking.bookingType === 'URGENT' ? '⚡ Urgent Priority' : 'Plan Ahead'}
              </Text>
            </View>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Ritual:</Text>
            <Text style={s.detailVal}>{pooja?.name || booking.ritualName || booking.poojaName || booking.title || 'Satyanarayan Pooja'}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Muhurat:</Text>
            <Text style={s.detailVal}>
              {booking.scheduledAt || (booking.scheduledDate ? `${booking.scheduledDate}${booking.scheduledTime ? ` • ${booking.scheduledTime}` : ''}` : 'Today')}
            </Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Destination:</Text>
            <Text style={s.detailVal} numberOfLines={2}>{booking.address || booking.serviceAddress || 'Address provided'}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Samagri:</Text>
            <Text style={s.detailVal}>{booking.withSamagri ? 'Pandit will bring' : 'Arranged by Yajman'}</Text>
          </View>
          {booking.urgentSurcharge > 0 && (
            <View style={s.detailRow}>
              <Text style={[s.detailKey, { color: '#B45309' }]}>Urgent Surcharge:</Text>
              <Text style={[s.detailVal, { color: '#B45309', fontWeight: '700' }]}>
                + ₹ {booking.urgentSurcharge}
              </Text>
            </View>
          )}
          <View style={s.detailRow}>
            <Text style={s.detailKey}>Total Dakshina:</Text>
            <Text style={[s.detailVal, { color: '#67101F', fontWeight: '800' }]}>
              ₹ {Number(booking.totalAmount ?? booking.total ?? booking.amount ?? 2500).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* CANCELLATION BUTTON */}
        {!isInProgress && !isCompleted && (
          <TouchableOpacity style={s.cancelTextBtn} onPress={handleCancelBooking}>
            <Text style={s.cancelText}>Cancel Booking (View Refund Policy)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MASKED CALL MODAL */}
      <Modal visible={showCallModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalIconCircle}>
              <MaterialCommunityIcons name="phone-lock" size={36} color="#67101F" />
            </View>
            <Text style={s.modalTitle}>Secure Masked Call</Text>
            <Text style={s.modalSubtitle}>
              To protect the privacy of both devotee and pandit, personal mobile numbers are never revealed. Calls are bridged through a secure virtual number.
            </Text>

            <View style={s.virtualBox}>
              <Text style={s.virtualLabel}>Virtual Bridge Number:</Text>
              <Text style={s.virtualNumber}>+91 11 4084 4892</Text>
              <Text style={s.virtualNote}>Call connects automatically to assigned pandit</Text>
            </View>

            <TouchableOpacity
              style={s.startCallBtn}
              onPress={() => {
                setShowCallModal(false);
                Alert.alert('Connecting Call', 'Connecting to Pandit Ji via secure virtual bridge...');
              }}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={s.startCallBtnText}>Start Masked Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowCallModal(false)}>
              <Text style={s.modalCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DISPUTE MODAL */}
      <Modal visible={showDisputeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={[s.modalIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#DC2626" />
            </View>
            <Text style={s.modalTitle}>Raise a Dispute or Support Request</Text>
            <Text style={s.modalSubtitle}>
              Our Vedic resolution team will intervene immediately if there is any issue with ritual conduct.
            </Text>

            <View style={s.disputeReasons}>
              {[
                'Pooja procedure incomplete or ended early',
                'Samagri missing or substandard',
                'Pandit behavior issue',
                'Other reason',
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[s.disputeRadio, disputeReason === r && s.disputeRadioActive]}
                  onPress={() => setDisputeReason(r)}
                >
                  <MaterialCommunityIcons
                    name={disputeReason === r ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={disputeReason === r ? '#67101F' : '#8A7466'}
                  />
                  <Text style={s.disputeRadioText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.submitDisputeBtn} onPress={handleDisputeSubmit}>
              <Text style={s.submitDisputeBtnText}>Submit Dispute</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowDisputeModal(false)}>
              <Text style={s.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF5EE',
    borderBottomWidth: 1,
    borderBottomColor: '#EADBCE',
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCE',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  screenTitle: {
    fontFamily: serif,
    fontSize: 17,
    fontWeight: '800',
    color: '#67101F',
  },
  screenSub: {
    fontSize: 11,
    color: '#8A6E58',
    marginTop: 1,
  },
  helpBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mapWrapper: {
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...shadow,
  },
  upcomingScheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    ...shadow,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingCalendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FBF8F2',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingTitle: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '800',
    color: '#2E1418',
  },
  upcomingDateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#67101F',
    marginTop: 2,
  },
  upcomingTrackingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3E5D4',
  },
  upcomingTrackingNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#7D686B',
    lineHeight: 17,
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  urgentBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  normalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  normalBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  mapFloatingCard: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    ...shadow,
  },
  mapFloatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#67101F',
  },
  distText: {
    fontSize: 12,
    color: '#8A6E58',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    marginBottom: 14,
    ...shadow,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: {
    backgroundColor: '#67101F',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#EFE4D6',
  },
  stepLineDone: {
    backgroundColor: '#67101F',
  },
  statusLabelRow: {
    alignItems: 'center',
  },
  statusMainText: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
    textAlign: 'center',
  },
  statusSubText: {
    fontSize: 12,
    color: '#755848',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#D48B28',
    marginBottom: 14,
    alignItems: 'center',
    ...shadow,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpCardTitle: {
    fontFamily: serif,
    fontSize: 15,
    fontWeight: '800',
    color: '#A05E0A',
    letterSpacing: 0.5,
  },
  otpInstruction: {
    fontSize: 12,
    color: '#755848',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  otpDigitsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  otpBox: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFF9EE',
    borderWidth: 1.5,
    borderColor: '#D48B28',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  otpDigit: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3A1208',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EADBCE',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#67101F',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EAE0',
  },
  liveTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    marginRight: 5,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  timerDigits: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
  },
  panditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    marginBottom: 14,
    ...shadow,
  },
  panditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panditAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#D48B28',
  },
  panditName: {
    fontFamily: serif,
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
  },
  panditGurukul: {
    fontSize: 11,
    color: '#8A6E58',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D48B28',
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 11,
    color: '#8A6E58',
    marginLeft: 3,
  },
  dotSep: {
    marginHorizontal: 5,
    color: '#C4B5A5',
  },
  expText: {
    fontSize: 11,
    color: '#755848',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F6EFE6',
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5EE',
    borderWidth: 1.2,
    borderColor: '#EADBCE',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#67101F',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67101F',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    ...shadow,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE4D6',
    marginBottom: 14,
  },
  detailsCardTitle: {
    fontFamily: serif,
    fontSize: 14,
    fontWeight: '700',
    color: '#67101F',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailKey: {
    fontSize: 12,
    color: '#8A6E58',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A1208',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  cancelTextBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: '800',
    color: '#67101F',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#755848',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
  },
  virtualBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#EADBCE',
  },
  virtualLabel: {
    fontSize: 11,
    color: '#8A6E58',
    textTransform: 'uppercase',
  },
  virtualNumber: {
    fontFamily: serif,
    fontSize: 20,
    fontWeight: '900',
    color: '#67101F',
    marginVertical: 4,
  },
  virtualNote: {
    fontSize: 10.5,
    color: '#A05E0A',
  },
  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67101F',
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    gap: 6,
    ...shadow,
  },
  startCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#8A6E58',
    fontWeight: '700',
  },
  disputeReasons: {
    width: '100%',
    marginVertical: 14,
  },
  disputeRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  disputeRadioActive: {
    backgroundColor: '#FFF4E5',
  },
  disputeRadioText: {
    fontSize: 13,
    color: '#3A1208',
    flex: 1,
  },
  submitDisputeBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  submitDisputeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subText: {
    fontSize: 14,
    color: '#755848',
  },
  rebookBtn: {
    marginTop: 14,
    backgroundColor: '#67101F',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rebookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
