import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Muted, Screen, SectionTitle, Title } from '../../components/ui';
import { colors, radius, space } from '../../theme';
import { initials } from '../../utils/format';

type Item = { icon: string; title: string; sub: string; to: string };

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { session, serverUrl, signOut } = useAuth();
  const user = session?.users.oms;

  const work: Item[] = [
    { icon: '⏰', title: 'Reminders', sub: 'Follow-ups and bookings', to: 'Reminders' },
    { icon: '👥', title: 'Customers & Resellers', sub: 'Contacts and balances due', to: 'Customers' },
    { icon: '🎫', title: 'Tickets', sub: 'Raise and track support tickets', to: 'Tickets' },
    { icon: '💵', title: 'My Fund', sub: 'Cash collected and transfers', to: 'Fund' },
    { icon: '🛍️', title: 'LizyMart Catalogue', sub: 'Products, services and sales notes', to: 'Lizymart' },
    { icon: '🔔', title: 'Notifications', sub: 'Lead reminders and task updates', to: 'Notifications' },
  ];

  const modules: Item[] = [];
  if (session?.tokens.partnership) {
    modules.push({ icon: '🤝', title: 'Partnership', sub: 'Partners, commissions and payouts', to: 'Partnership' });
  }
  if (session?.tokens.universal) {
    modules.push({ icon: '🌐', title: 'Website Admin', sub: 'Content overview and enquiries', to: 'Website' });
  }

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Sign out of LBOS on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <Screen>
      <Pressable onPress={() => navigation.navigate('Profile')} style={({ pressed }) => [s.profile, pressed && { opacity: 0.8 }]}>
        <Avatar text={initials(user?.name)} size={52} />
        <View style={{ flex: 1, marginLeft: space.md }}>
          <Title style={{ fontSize: 17 }}>{user?.name}</Title>
          <Muted>{user?.email}</Muted>
          <Text style={s.viewProfile}>View profile ›</Text>
        </View>
      </Pressable>

      <SectionTitle>Work</SectionTitle>
      <View style={s.group}>{work.map((item, i) => <MenuRow key={item.to} item={item} last={i === work.length - 1} />)}</View>

      {modules.length ? (
        <>
          <SectionTitle>Other modules</SectionTitle>
          <View style={s.group}>{modules.map((item, i) => <MenuRow key={item.to} item={item} last={i === modules.length - 1} />)}</View>
        </>
      ) : null}

      <Pressable onPress={confirmSignOut} style={({ pressed }) => [s.signOut, pressed && { opacity: 0.8 }]}>
        <Text style={s.signOutText}>Sign out</Text>
      </Pressable>
      <Muted style={{ textAlign: 'center', marginTop: space.md, fontSize: 11 }}>Connected to {serverUrl}</Muted>
    </Screen>
  );
}

function MenuRow({ item, last }: { item: Item; last: boolean }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate(item.to)}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && { backgroundColor: colors.neutralSoft }]}>
      <Text style={s.rowIcon}>{item.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{item.title}</Text>
        <Muted>{item.sub}</Muted>
      </View>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  viewProfile: { color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 4 },
  group: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: space.lg },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { fontSize: 22, width: 36 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 24, color: colors.faint, marginLeft: space.sm },
  signOut: {
    marginTop: space.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  signOutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
