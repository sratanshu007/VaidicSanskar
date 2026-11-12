import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { serif } from '../theme/styles';

const USER_STORAGE_KEY = '@vaidic_sanskar_user_profile';

export default function SplashScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const haloSize = Math.min(Math.round(width * 0.84), 340);
  const outerRingSize = Math.min(Math.round(width * 0.28), 114);
  const innerRingSize = Math.round(outerRingSize * 0.84);
  const omIconSize = Math.round(innerRingSize * 0.58);
  const titleFontSize = Math.min(34, Math.max(26, Math.round(width * 0.088)));
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Release native splash immediately so this animated splash screen is immediately seen
    ExpoSplashScreen.hideAsync().catch(() => {});

    // Parallel entrance animations
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();

    // Check auth session and smoothly transition
    const timer = setTimeout(async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.id || parsed.phone || parsed.name || parsed.email)) {
            navigation.replace('Main');
            return;
          }
        }
      } catch (_) {}
      navigation.replace('LoginMode');
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sacred Deep Maroon to Cosmic Dark Gradient */}
      <LinearGradient
        colors={['#5A1017', '#38090E', '#160205']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Pulsing Sacred Golden Halo */}
      <Animated.View
        style={[
          s.glow,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            opacity: glow,
            transform: [{ scale: scale.interpolate({ inputRange: [0.82, 1], outputRange: [0.9, 1.1] }) }],
          },
        ]}
      />

      {/* Center Devotional Branding */}
      <Animated.View
        style={[
          s.content,
          { paddingBottom: Math.max(height * 0.04, 20), opacity: fade, transform: [{ scale }] },
        ]}
      >
        {/* Sacred Lotus / Diya Top Accent */}
        <MaterialCommunityIcons name="hands-pray" size={30} color={colors.saffron || '#EAA838'} style={{ marginBottom: 12 }} />

        {/* Golden Om Emblem Disc */}
        <View
          style={[
            s.omOuterRing,
            {
              width: outerRingSize,
              height: outerRingSize,
              borderRadius: outerRingSize / 2,
            },
          ]}
        >
          <View
            style={[
              s.omInnerRing,
              {
                width: innerRingSize,
                height: innerRingSize,
                borderRadius: innerRingSize / 2,
              },
            ]}
          >
            <MaterialCommunityIcons name="om" size={omIconSize} color="#FCE1A8" />
          </View>
        </View>

        {/* Brand Name */}
        <Text
          style={[s.title, { fontSize: titleFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.15}
        >
          VaidicSanskar
        </Text>

        {/* Sanskrit Sacred Shloka Tagline */}
        <View style={s.tagRow}>
          <View style={s.tagLine} />
          <Text style={s.tagText} numberOfLines={1} maxFontSizeMultiplier={1.15}>
            संस्कार  •  साधना  •  समर्पण
          </Text>
          <View style={s.tagLine} />
        </View>

        <Text style={s.subtitle} maxFontSizeMultiplier={1.15}>
          Modern Services for{'\n'}Timeless Sacred Traditions
        </Text>
      </Animated.View>

      {/* Bottom Loading Progress & Sacred Connection Text */}
      <View style={[s.footer, { bottom: Math.max(insets.bottom, 22) + 18 }]}>
        <View style={s.track}>
          <Animated.View
            style={[
              s.bar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={s.connectText}>Connecting you with divine blessings...</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38090E',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(234, 168, 56, 0.14)',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  omOuterRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 168, 56, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(234, 168, 56, 0.08)',
  },
  omInnerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.saffron || '#EAA838',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(90, 16, 23, 0.85)',
    shadowColor: '#EAA838',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontFamily: serif,
    fontSize: 34,
    color: '#FFF2DB',
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  tagLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(234, 168, 56, 0.5)',
  },
  tagText: {
    color: '#EAA838',
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 1.2,
  },
  subtitle: {
    color: 'rgba(255, 244, 232, 0.82)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 42,
    width: '100%',
    alignItems: 'center',
  },
  track: {
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAA838',
    shadowColor: '#EAA838',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  connectText: {
    color: 'rgba(255, 244, 232, 0.75)',
    fontSize: 12,
    marginTop: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
