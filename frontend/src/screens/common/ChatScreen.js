import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/ui';
import colors from '../../theme/colors';
import { panditBookingStore } from '../../services/panditBookingStore';
import socket from '../../services/socket';
import { useKeyboardLift } from '../../utils/useKeyboardLift';

/**
 * Phone Number Detection & Blocker:
 * Prevents sharing of phone numbers to strictly comply with privacy policy and prevent platform disintermediation.
 */
export function isPhoneNumberBlocked(input) {
  if (!input || typeof input !== 'string') return false;

  // 1. Standard Indian 10-digit mobile number with optional +91/0 prefix and separators
  const phoneRegex = /(?:(?:\+|0{0,2})91[\s.-]*)?(?:[6-9][\s.-]*(?:\d[\s.-]*){9})/i;
  if (phoneRegex.test(input)) return true;

  // 2. Any sequence containing 10 or more digits
  const digitsOnly = input.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 10) return true;

  // 3. Obfuscated digits with spaces/dots/dashes
  const spacedDigits = input.match(/(?:\d[\s\-_.,/]*){10,}/g);
  if (spacedDigits && spacedDigits.length > 0) return true;

  return false;
}

const QUICK_REPLIES = [
  'मैं घर पर ही हूँ 🙏',
  'सामग्री तैयार है',
  'कृपया 4th फ्लोर पर आएं',
  'लिफ्ट काम कर रही है',
  'कॉल करें',
];

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const booking = panditBookingStore.getBooking();
  const name = route.params?.name || booking?.pandit?.name || 'पंडित जी';
  const bId = String(booking?.id || route.params?.bookingId || '');
  const [messages, setMessages] = useState(booking?.chatMessages || []);
  const [text, setText] = useState('');
  const listRef = useRef();
  const { androidLift, onContainerLayout } = useKeyboardLift(() => {
    listRef.current?.scrollToEnd({ animated: true });
  });

  useEffect(() => {
    if (bId) {
      socket.join(bId);
    }

    const handleIncoming = (m) => {
      if (!m || !m.text) return;
      if (m.bookingId && bId && String(m.bookingId) !== String(bId)) return;
      if (m.from === 'yajman' || m.sender === 'yajman') return; // ignore own echo

      panditBookingStore.sendChatMessage('pandit', m.text);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const unsubMsg = socket.on('chat:message', handleIncoming);
    const unsubChat = socket.on('booking:chat', handleIncoming);

    const unsubStore = panditBookingStore.subscribe((b) => {
      if (b?.chatMessages && Array.isArray(b.chatMessages)) {
        setMessages([...b.chatMessages]);
      }
    });

    return () => {
      if (typeof unsubMsg === 'function') unsubMsg();
      if (typeof unsubChat === 'function') unsubChat();
      if (typeof unsubStore === 'function') unsubStore();
    };
  }, [bId]);

  const send = (msgText) => {
    const content = (msgText || text).trim();
    if (!content) return;

    // Check privacy compliance: block phone numbers
    if (isPhoneNumberBlocked(content)) {
      Alert.alert(
        '⚠️ फोन नंबर साझा करना प्रतिबंधित है',
        'गोपनीयता नीति (Privacy Policy) के अनुसार व्यक्तिगत मोबाइल नंबर चैट में भेजना प्रतिबंधित है।\n\nपंडित जी से संपर्क करने के लिए "Masked Call" सुविधा का उपयोग करें।',
        [{ text: 'समझ गया' }]
      );
      return;
    }

    panditBookingStore.sendChatMessage('yajman', content);

    const payload = {
      bookingId: bId || 'LIVE',
      id: 'm-' + Date.now(),
      sender: 'yajman',
      from: 'yajman',
      to: 'pandit',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };

    socket.emit('chat:message', payload);
    socket.emit('booking:chat', payload);

    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      onLayout={onContainerLayout}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        s.container,
        Platform.OS === 'android' && androidLift > 0 ? { paddingBottom: androidLift } : null,
      ]}
    >
      <Header
        title={name}
        subtitle="🔒 Number masked · end-to-end encrypted"
        navigation={navigation}
        right={
          <TouchableOpacity
            style={s.callHeaderBtn}
            onPress={() => Alert.alert('Masked Call', 'पंडित जी से सुरक्षित मास्क्ड कॉल कनेक्ट हो रही है (+91 11 4084 4892)...')}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#3A1208" />
          </TouchableOpacity>
        }
      />

      {/* TOP PRIVACY BANNER */}
      <View style={s.privacyNotice}>
        <MaterialCommunityIcons name="shield-lock" size={15} color="#B45309" />
        <Text style={s.privacyNoticeText}>
          सुरक्षित संचार: व्यक्तिगत मोबाइल नंबर साझा करना प्रतिबंधित है।
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 10, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender === 'yajman';
          const isSys = item.sender === 'system';

          if (isSys) {
            return (
              <View style={s.sysBubble}>
                <Text style={s.sysText}>{item.text}</Text>
              </View>
            );
          }

          return (
            <View style={[s.bubble, isMe ? s.me : s.them]}>
              <Text style={[s.msg, isMe && s.meText]}>{item.text}</Text>
              <Text style={[s.time, isMe && s.meTime]}>{item.time}</Text>
            </View>
          );
        }}
      />

      {/* QUICK REPLIES BAR */}
      <View style={s.quickBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 12 }}>
          {QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={s.quickChip} onPress={() => send(q)}>
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View
        style={[
          s.inputBar,
          { paddingBottom: androidLift > 0 ? 10 : Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          style={s.input}
          placeholder="संदेश लिखें (Type a message)..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120)}
          multiline
          maxLength={1000}
          textAlignVertical="center"
        />
        <TouchableOpacity style={s.sendBtn} onPress={() => send()}>
          <MaterialCommunityIcons name="send" size={20} color="#3A1208" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  callHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  privacyNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  me: {
    backgroundColor: '#EAA838',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  them: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  sysBubble: {
    alignSelf: 'center',
    backgroundColor: '#F3EAE0',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginVertical: 8,
  },
  sysText: {
    fontSize: 11,
    color: '#755848',
    fontWeight: '600',
  },
  msg: {
    fontSize: 14,
    color: '#3A1208',
    lineHeight: 19,
  },
  meText: {
    color: '#3A1208',
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    color: '#8A7466',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  meTime: {
    color: '#522E18',
  },
  quickBar: {
    paddingVertical: 8,
    backgroundColor: '#FAF7F0',
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    marginRight: 8,
  },
  quickText: {
    fontSize: 12,
    color: '#6E5544',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE4D6',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: '#FAF7F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3A1208',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EAA838',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
