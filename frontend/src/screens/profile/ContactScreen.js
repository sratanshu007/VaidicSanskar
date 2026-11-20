import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header, Screen, Card, Field, Button } from '../../components/ui';
import colors from '../../theme/colors';

const contacts = [
  { icon: 'email', label: 'Email Support', value: 'support@vaidicsanskar.com', action: 'mailto:support@vaidicsanskar.com' },
];

export default function ContactScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <Header title="Contact Us" navigation={navigation} />
      <Screen>
        {contacts.map((c) => (
          <TouchableOpacity key={c.label} style={s.row} onPress={() => Linking.openURL(c.action).catch(() => {})}>
            <View style={s.icon}><MaterialCommunityIcons name={c.icon} size={22} color={colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.label}>{c.label}</Text>
              <Text style={s.value}>{c.value}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={s.section}>Send us a message</Text>
        <Field label="Name" icon="account" placeholder="Your name" />
        <Field label="Email" icon="email" placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Message" icon="message-text" placeholder="How can we help?" multiline />
        <Button title="Send Message" onPress={() => navigation.goBack()} />
      </Screen>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginVertical: 16 },
});
