import React from 'react';
import { Alert, View } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Avatar, Badge, Button, Card, Divider, ErrorState, KeyValue, Loading, Muted, Row, Screen, SectionTitle, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, initials, label, money } from '../../utils/format';

const mask = (v?: string | null) => (v ? `•••• ${String(v).slice(-4)}` : null);

export default function PartnerProfileScreen() {
  const { session, serverUrl, signOut } = useAuth();
  const { data: p, error, loading, refreshing, refresh } = useApi(() => api.get('partnership', '/v1/me/partner'));

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Sign out of the partner portal on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  if (loading) {
    return <Loading />;
  }
  if (error || !p) {
    return (
      <View style={{ flex: 1 }}>
        <ErrorState message={error ?? 'Could not load your profile.'} onRetry={refresh} />
        <Button title="Sign out" variant="danger" onPress={confirmSignOut} style={{ margin: space.lg }} />
      </View>
    );
  }

  const enrollments: any[] = p.enrollments ?? [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Card>
        <Row>
          <Avatar text={initials(p.name)} size={56} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Title style={{ fontSize: 18 }}>{p.name}</Title>
            <Muted>{p.partner_code}</Muted>
            <Row style={{ gap: space.sm, marginTop: space.sm }}>
              <Badge status={p.status} />
              {p.partner_type?.name ? <Badge text={p.partner_type.name} color={colors.primary} /> : null}
            </Row>
          </View>
        </Row>
        <Divider />
        <KeyValue k="Current balance" v={<Title style={{ color: Number(p.current_balance) >= 0 ? colors.success : colors.danger }}>{money(p.current_balance)}</Title>} />
      </Card>

      <SectionTitle>Contact</SectionTitle>
      <Card>
        <KeyValue k="Email" v={p.email ?? session?.users.partnership?.email} />
        <KeyValue k="Phone" v={p.phone} />
        <KeyValue k="Alt. phone" v={p.alt_phone} />
        <KeyValue k="Address" v={p.address} />
        <KeyValue k="Location" v={p.location} />
      </Card>

      <SectionTitle>Business</SectionTitle>
      <Card>
        <KeyValue k="Entity" v={label(p.entity_type)} />
        <KeyValue k="Category" v={p.partner_category?.name} />
        <KeyValue k="GSTIN" v={p.gstin} />
        <KeyValue k="PAN" v={p.pan} />
        <KeyValue k="Active since" v={p.activated_at ? date(p.activated_at) : null} />
      </Card>

      <SectionTitle>Bank</SectionTitle>
      <Card>
        <KeyValue k="Account name" v={p.bank_account_name} />
        <KeyValue k="Account no." v={mask(p.bank_account_number)} />
        <KeyValue k="IFSC" v={p.bank_ifsc} />
        <KeyValue k="Bank" v={p.bank_name} />
      </Card>

      {enrollments.length ? (
        <>
          <SectionTitle>Partner programmes</SectionTitle>
          <Card>
            {enrollments.map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between' }}>
                  <Title style={{ fontSize: 15 }}>{e.partner_type?.name ?? 'Programme'}</Title>
                  <Badge status={e.status} />
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Muted style={{ marginTop: space.md, fontSize: 12 }}>To change these details, contact your Lizy partner manager.</Muted>
      <Button title="Sign out" variant="danger" onPress={confirmSignOut} style={{ marginTop: space.lg }} />
      <Muted style={{ textAlign: 'center', marginTop: space.md, fontSize: 11 }}>Connected to {serverUrl}</Muted>
    </Screen>
  );
}
