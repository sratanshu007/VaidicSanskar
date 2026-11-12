import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import styles, { serif, radius, shadow } from '../../theme/styles';
import talkToAstroStore, { RECHARGE_PACKS } from '../../services/talkToAstroStore';
import { resolveDevotionalSource } from '../../constants/devotionalAssets';
import AgoraCallView from '../../components/agora/AgoraCallView';
import socket from '../../services/socket';

export default function CallScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [astrologer, setAstrologer] = useState(
    () =>
      route.params?.astrologer ||
      talkToAstroStore.resolveTargetAstrologer(null).astrologer ||
      talkToAstroStore.getAstrologers()[0]
  );
  const mode = route.params?.mode || 'audio'; // audio | video
  const channelName = useRef(
    route.params?.channelName || `vartalap_${astrologer?.id || 'ASTRO-7890'}_${Date.now().toString().slice(-6)}`
  ).current;

  const [session, setSession] = useState(talkToAstroStore.getActiveSession());
  const [callAccepted, setCallAccepted] = useState(Boolean(route.params?.alreadyConnected));
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoCamOff, setIsVideoCamOff] = useState(mode === 'audio');
  const [isFrontCam, setIsFrontCam] = useState(true);
  const [liveAgoraToken, setLiveAgoraToken] = useState(route.params?.agoraToken || null);
  const [liveAgoraAppId, setLiveAgoraAppId] = useState(route.params?.agoraAppId || null);
  const [activeRecipientId, setActiveRecipientId] = useState(astrologer?.id || 'ASTRO-7890');
  const [agoraStatus, setAgoraStatus] = useState({
    stage: 'connecting',
    micActive: false,
    remoteJoined: false,
    error: null,
  });

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['सटीक गणना', 'सरल उपाय']);
  const [reviewText, setReviewText] = useState('');

  const rate = astrologer?.rates?.[mode] || astrologer?.[`${mode}Rate`] || 5;
  const timerRef = useRef(null);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    // Only initiate signaling if this call was not already accepted from profile
    if (!route.params?.alreadyConnected) {
      socket.emit('user:join', { userId: 'U101' });
      const { astrologer: targetAstro } = talkToAstroStore.resolveTargetAstrologer(astrologer);
      const initialRecipient = targetAstro?.id || astrologer?.id || 'ASTRO-7890';
      setActiveRecipientId(initialRecipient);
      socket.emit('astro:call:initiate', {
        channelName,
        recipientId: initialRecipient,
        caller: {
          id: 'U101',
          name: 'स्रतांशु शुक्ला (यजमान)',
          phone: '+91 63936 20028',
          mode,
          rate,
          birthDetails: {
            dob: '14-08-1995',
            tob: '07:30 AM',
            pob: 'वाराणसी, उत्तर प्रदेश',
            gender: 'पुरुष (Male)',
            kundali: {
              lagna: 'सिंह (Leo)',
              rashi: 'वृश्चिक (Scorpio)',
              nakshatra: 'अनुराधा (चरण 2)',
              dasha: 'बुध महादशा • शुक्र अंतर्दशा',
              favorablePlanets: 'सूर्य, मंगल, गुरु',
              remedyRecommended: 'आदित्य हृदय स्तोत्र पाठ, सूर्य को अर्घ्य',
            },
          },
        },
        mode,
        rate,
        topic: 'परामर्श',
      });
    }

    const handleRemoteEnd = () => {
      if (!hasEndedRef.current) {
        handleEndCall(false);
      }
    };

    const handleCallConnected = (payload) => {
      setCallAccepted(true);
      if (payload?.agoraToken) {
        setLiveAgoraToken(payload.agoraToken);
      }
      if (payload?.agoraAppId) {
        setLiveAgoraAppId(payload.agoraAppId);
      }
      if (payload?.astrologer) {
        setAstrologer((prev) => ({ ...(prev || {}), ...payload.astrologer, isOnline: true }));
      }
      if (payload?.vendorId || payload?.astrologer?.id) {
        setActiveRecipientId(payload.vendorId || payload.astrologer.id);
      }
    };

    const handleCallRouted = (payload) => {
      if (payload?.recipientId) {
        setActiveRecipientId(payload.recipientId);
      }
      if (payload?.astrologer) {
        setAstrologer((prev) => ({ ...(prev || {}), ...payload.astrologer, isOnline: true }));
      }
    };

    const handleCallDeclined = () => {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      clearInterval(timerRef.current);
      Alert.alert(
        'कॉल अस्वीकृत',
        'ज्योतिषाचार्य ने अभी कॉल अस्वीकार कर दी है। कृपया अन्य ऑनलाइन ज्योतिषी से प्रयास करें।',
        [{ text: 'ठीक है', onPress: () => navigation.goBack() }]
      );
    };

    const handleCallUnavailable = (payload) => {
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      clearInterval(timerRef.current);
      Alert.alert(
        'ज्योतिषी उपलब्ध नहीं',
        payload?.message || 'वर्तमान में कोई भी ज्योतिषी ऑनलाइन उपलब्ध नहीं है।',
        [{ text: 'ठीक है', onPress: () => navigation.goBack() }]
      );
    };

    const unsubEnd = socket.on('astro:call:ended', handleRemoteEnd);
    const unsubConn = socket.on('astro:call:connected', handleCallConnected);
    const unsubRoute = socket.on('astro:call:routed', handleCallRouted);
    const unsubDecline = socket.on('astro:call:declined', handleCallDeclined);
    const unsubUnavail = socket.on('astro:call:unavailable', handleCallUnavailable);

    return () => {
      clearInterval(timerRef.current);
      if (typeof unsubEnd === 'function') unsubEnd();
      if (typeof unsubConn === 'function') unsubConn();
      if (typeof unsubRoute === 'function') unsubRoute();
      if (typeof unsubDecline === 'function') unsubDecline();
      if (typeof unsubUnavail === 'function') unsubUnavail();
    };
  }, []);

  // Run billing clock only once call is accepted or remote participant joins audio/video
  useEffect(() => {
    if (!callAccepted && !agoraStatus.remoteJoined) return undefined;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next > 0 && next % 60 === 0) {
          talkToAstroStore.deductMoney(rate, `Astro ${mode === 'video' ? 'Video' : 'Audio'} Call (1 min)`);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [callAccepted, agoraStatus.remoteJoined, rate, mode]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const billedMinutes = Math.max(1, Math.ceil(elapsed / 60));
  const currentTotal = billedMinutes * rate;
  const remainingBal = talkToAstroStore.getTotalBalance();
  const remainingMinutes = Math.max(0, Math.floor(remainingBal / rate));

  const handleEndCall = (notifyRemote = true) => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    clearInterval(timerRef.current);
    if (notifyRemote) {
      socket.emit('astro:call:end', {
        channelName,
        callerId: 'U101',
        recipientId: activeRecipientId || astrologer?.id || 'ASTRO-7890',
      });
    }
    talkToAstroStore.endSession(notifyRemote ? 'USER_ENDED' : 'REMOTE_ENDED');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    talkToAstroStore.submitSessionReview({
      rating,
      tags: selectedTags,
      text: reviewText,
      anonymous: false,
    });
    setShowReviewModal(false);
    talkToAstroStore.clearSession();
    navigation.navigate('Vartalap');
  };

  const toggleTag = (t) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((i) => i !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  const isVideo = mode === 'video';

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: '#0D0614',
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: Math.max(insets.bottom, 20) + 8,
          paddingHorizontal: 12,
        },
      ]}
    >
      {/* Top Floating Meter */}
      <View style={[s.topFloatingMeter, s.topFloatingMeterDark]}>
        <View style={s.meterItem}>
          <MaterialCommunityIcons name="timer-sand" size={16} color={colors.gold || '#D48B28'} />
          <Text style={[s.meterText, { color: '#FFFFFF' }]}>{formatTimer(elapsed)}</Text>
        </View>
        <View style={[s.meterDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        <View style={s.meterItem}>
          <MaterialCommunityIcons name="wallet-outline" size={16} color={colors.gold || '#D48B28'} />
          <Text style={[s.meterText, { color: '#FFFFFF' }]}>₹{rate}/min</Text>
        </View>
        <View style={[s.meterDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        <TouchableOpacity
          style={[s.rechargeQuickChip, { backgroundColor: 'rgba(230, 126, 0, 0.25)', borderWidth: 1, borderColor: colors.gold || '#D48B28' }]}
          onPress={() => setShowRechargeModal(true)}
        >
          <Text style={[s.rechargeQuickChipText, { color: colors.goldLight || '#F6DFB8' }]}>
            ~{remainingMinutes}m शेष (+ रीचार्ज)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Connection State Pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: callAccepted ? 'rgba(34, 197, 94, 0.16)' : 'rgba(245, 158, 11, 0.18)',
          borderColor: callAccepted ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 191, 36, 0.45)',
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginTop: 6,
          marginBottom: 4,
          gap: 6,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: agoraStatus.remoteJoined ? '#4ADE80' : callAccepted ? '#38BDF8' : '#FBBF24',
          }}
        />
        <Text style={{ color: '#FBF7F0', fontSize: 11.5, fontWeight: '700' }}>
          {!callAccepted
            ? 'रिंग हो रही है... ज्योतिषाचार्य की प्रतीक्षा'
            : agoraStatus.remoteJoined
            ? mode === 'audio'
              ? 'लाइव वॉइस कॉल सक्रिय • दोनों पक्ष जुड़े'
              : 'लाइव वीडियो कॉल सक्रिय'
            : agoraStatus.micActive
            ? 'माइक चालू • लाइव ऑडियो जुड़ गया'
            : 'कॉल स्वीकृत • लाइव चैनल से जुड़ रहे हैं...'}
        </Text>
      </View>

      {/* Main Video / Audio Center Stage Powered by Agora */}
      <View style={s.centerStage}>
        <AgoraCallView
          channelName={channelName}
          mode={mode}
          appId={liveAgoraAppId}
          token={liveAgoraToken}
          isMuted={isMuted}
          isSpeaker={isSpeaker}
          isVideoCamOff={isVideoCamOff}
          isFrontCam={isFrontCam}
          remoteName={astrologer?.name || 'ज्योतिषाचार्य'}
          remotePhoto={astrologer?.photo}
          role="user"
          onCallConnected={() => setCallAccepted(true)}
          onStatusChange={(nextStatus) => setAgoraStatus((prev) => ({ ...prev, ...nextStatus }))}
          onCallEnded={() => handleEndCall(false)}
        />
      </View>

      {/* Shared Kundali Info Card */}
      <View style={[s.kundaliSnippetCard, s.kundaliSnippetCardDark]}>
        <MaterialCommunityIcons name="om" size={15} color={colors.gold || '#D48B28'} />
        <Text style={[s.kundaliSnippetText, { color: '#FFECCC' }]} numberOfLines={1}>
          साझा जन्म विवरण: स्रतांशु शुक्ला • सिंह लग्न • वृश्चिक राशि
        </Text>
      </View>

      {/* Call Controls Bar */}
      <View style={s.controlsBar}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[s.ctrlCircle, s.ctrlCircleDark, isMuted && s.ctrlCircleActive]}
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'microphone-off' : 'microphone'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={s.ctrlLabel}>{isMuted ? 'म्यूट' : 'माइक'}</Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[s.ctrlCircle, s.ctrlCircleDark, isSpeaker && s.ctrlCircleActive]}
          onPress={() => setIsSpeaker(!isSpeaker)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isSpeaker ? 'volume-high' : 'volume-medium'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={s.ctrlLabel}>{isSpeaker ? 'स्पीकर ON' : 'स्पीकर'}</Text>
        </TouchableOpacity>

        {/* Video Camera Controls (if in video mode) */}
        {isVideo && (
          <>
            <TouchableOpacity
              style={[s.ctrlCircle, s.ctrlCircleDark, isVideoCamOff && s.ctrlCircleActive]}
              onPress={() => setIsVideoCamOff(!isVideoCamOff)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isVideoCamOff ? 'video-off' : 'video'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={s.ctrlLabel}>{isVideoCamOff ? 'कैमरा बंद' : 'कैमरा'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.ctrlCircle, s.ctrlCircleDark]}
              onPress={() => setIsFrontCam(!isFrontCam)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="camera-flip" size={20} color="#FFFFFF" />
              <Text style={s.ctrlLabel}>फ्लिप</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Hang Up Button */}
        <TouchableOpacity style={s.hangUpBtn} onPress={() => handleEndCall(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFFFFF" />
          <Text style={s.hangUpLabel}>काटें</Text>
        </TouchableOpacity>
      </View>

      {/* Post-Call Review & Bill Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>कॉल समाप्त • परामर्श सारांश</Text>

            <View style={s.billBox}>
              <View style={s.billRow}>
                <Text style={s.billLabel}>कुल समय:</Text>
                <Text style={s.billVal}>{billedMinutes} मिनट ({formatTimer(elapsed)})</Text>
              </View>
              <View style={s.billRow}>
                <Text style={s.billLabel}>दर प्रति मिनट:</Text>
                <Text style={s.billVal}>₹{rate}</Text>
              </View>
              <View style={s.billRow}>
                <Text style={s.billLabel}>कुल बिल कटौती:</Text>
                <Text style={[s.billVal, { color: colors.primary }]}>₹{currentTotal}</Text>
              </View>
            </View>

            <Text style={s.reviewPrompt}>परामर्श कैसा रहा? रेटिंग दें:</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity key={num} onPress={() => setRating(num)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons
                    name={num <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.tagsRow}>
              {['सटीक गणना', 'सरल उपाय', 'धैर्यपूर्वक सुना', 'स्पष्ट आवाज'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.tagBtn, selectedTags.includes(t) && s.selectedTagBtn]}
                  onPress={() => toggleTag(t)}
                >
                  <Text style={[s.tagText, selectedTags.includes(t) && s.selectedTagText]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.reviewInput}
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="अपनी टिप्पणी लिखें (वैकल्पिक)..."
              placeholderTextColor="#A8988C"
            />

            <TouchableOpacity style={s.doneBtn} onPress={handleSubmitReview}>
              <Text style={s.doneBtnText}>समीक्षा जमा करें व समाप्त करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* In-Call Quick Recharge Modal */}
      <Modal visible={showRechargeModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.modalTitle}>कॉल के दौरान रीचार्ज</Text>
              <TouchableOpacity onPress={() => setShowRechargeModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={s.packsGrid}>
              {RECHARGE_PACKS.slice(0, 4).map((pack) => (
                <TouchableOpacity
                  key={pack.id}
                  style={s.packBox}
                  onPress={() => {
                    talkToAstroStore.rechargeWallet(pack);
                    setShowRechargeModal(false);
                    Alert.alert('रीचार्ज सफल', `₹${pack.amount} वॉलेट में जुड़ गए हैं। कॉल जारी रहेगी।`);
                  }}
                >
                  <Text style={s.packAmt}>₹{pack.amount}</Text>
                  <Text style={s.packLbl}>{pack.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topFloatingMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    ...shadow(2),
    zIndex: 20,
  },
  topFloatingMeterDark: {
    backgroundColor: 'rgba(20, 10, 30, 0.88)',
    borderColor: 'rgba(230, 126, 0, 0.4)',
  },
  meterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  meterDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#ECE3D7',
    marginHorizontal: 10,
  },
  rechargeQuickChip: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rechargeQuickChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  centerStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 6,
  },
  audioAvatarStage: {
    alignItems: 'center',
  },
  avatarPulseDisc: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFF4E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.saffron,
    marginBottom: 16,
  },
  audioAvatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  audioAstroName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: serif,
  },
  audioAstroTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  videoFrame: {
    width: '100%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoRemoteImage: {
    width: '100%',
    height: '100%',
  },
  videoWatermark: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoRemoteName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selfPip: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 80,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  pipText: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  kundaliSnippetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3DFC4',
    marginBottom: 10,
    maxWidth: '92%',
  },
  kundaliSnippetCardDark: {
    backgroundColor: 'rgba(25, 12, 36, 0.85)',
    borderColor: 'rgba(230, 126, 0, 0.35)',
  },
  kundaliSnippetText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 6,
    paddingTop: 8,
    zIndex: 20,
  },
  ctrlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  ctrlCircleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  ctrlCircleActive: {
    backgroundColor: '#67101F',
    borderColor: '#D48B28',
  },
  ctrlLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  hangUpBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#D13939',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D13939',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  hangUpLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    ...shadow(4),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 8,
  },
  billBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    padding: 10,
    marginVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  reviewPrompt: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 10,
  },
  tagBtn: {
    backgroundColor: '#FAF7F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  selectedTagBtn: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.saffron,
  },
  tagText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  selectedTagText: {
    fontWeight: '800',
  },
  reviewInput: {
    backgroundColor: '#FAF7F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#ECE3D7',
    height: 48,
    marginBottom: 12,
  },
  doneBtn: {
    backgroundColor: colors.saffron,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  packsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  packBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FAF7F0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE3D7',
  },
  packAmt: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  packLbl: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
