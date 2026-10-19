import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Button, Card, Empty, ErrorState, Field, FormSheet, Loading, Muted, PickerModal, Row, Screen, SectionTitle, styles as ui, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime, money } from '../../utils/format';

export default function FundScreen() {
  const { session } = useAuth();
  const me = session?.users.oms?.id;
  const { data, error, loading, refreshing, refresh } = useApi(() => api.get('oms', '/fund'));
  const [sheet, setSheet] = useState<'collect' | 'transfer' | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [toUser, setToUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pickUser, setPickUser] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('oms', '/users').then(setUsers).catch(() => {});
  }, []);

  const open = (kind: 'collect' | 'transfer') => {
    setOrderNumber('');
    setAmount('');
    setNote('');
    setToUser(null);
    setSheet(kind);
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (sheet === 'collect') {
        await api.post('oms', '/fund/collections', { order_number: orderNumber.trim(), amount: Number(amount), note: note.trim() || null });
      } else {
        if (!toUser) {
          throw new Error('Choose who receives the money.');
        }
        await api.post('oms', '/fund/transfer', { to_user_id: toUser.id, amount: Number(amount), note: note.trim() || null });
      }
      setSheet(null);
      refresh();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Loading />;
  }
  if (error || !data) {
    return <ErrorState message={error ?? 'Could not load your fund.'} onRetry={refresh} />;
  }

  const transactions: any[] = data.transactions ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
          <Text style={{ color: '#E0E7FF', fontSize: 13, fontWeight: '600' }}>Cash in hand</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 }}>{money(data.balance)}</Text>
          <Row style={{ gap: space.sm, marginTop: space.lg }}>
            <Button small variant="secondary" title="+ Record collection" onPress={() => open('collect')} style={{ flex: 1 }} />
            <Button small variant="secondary" title="↗ Transfer" onPress={() => open('transfer')} style={{ flex: 1 }} />
          </Row>
        </Card>

        <SectionTitle>Transactions</SectionTitle>
        {transactions.length === 0 ? <Empty text="No transactions yet." icon="💵" /> : null}
        {transactions.map(t => {
          const credit = t.direction === 'credit';
          const title =
            t.source === 'order_received'
              ? `Collected · ${t.order?.order_number ?? 'order'}`
              : credit
              ? `Received from ${t.counterparty_user?.name ?? 'staff'}`
              : `Sent to ${t.counterparty_user?.name ?? 'staff'}`;
          return (
            <Card key={t.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
                  {title}
                </Title>
                <Title style={{ color: credit ? colors.success : colors.danger }}>
                  {credit ? '+' : '−'}
                  {money(t.amount)}
                </Title>
              </Row>
              {t.note ? <Muted style={{ marginTop: 2 }}>{t.note}</Muted> : null}
              <Muted style={{ marginTop: 4, fontSize: 12 }}>{dateTime(t.created_at)}</Muted>
            </Card>
          );
        })}
      </Screen>

      <FormSheet visible={sheet !== null} title={sheet === 'collect' ? 'Record cash collected' : 'Transfer to a colleague'} onClose={() => setSheet(null)}>
        {sheet === 'collect' ? (
          <Field label="Order number *" value={orderNumber} onChangeText={setOrderNumber} autoCapitalize="characters" />
        ) : (
          <>
            <Text style={ui.fieldLabel}>To *</Text>
            <Pressable onPress={() => setPickUser(true)} style={[ui.input, { paddingVertical: 12, marginBottom: space.md }]}>
              <Text style={{ color: toUser ? colors.text : colors.faint, fontSize: 15 }}>{toUser?.name ?? 'Choose a person'}</Text>
            </Pressable>
            <Muted style={{ marginBottom: space.md }}>Available: {money(data.balance)}</Muted>
          </>
        )}
        <Field label="Amount (₹) *" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Field label="Note" value={note} onChangeText={setNote} />
        <Button title="Save" onPress={submit} loading={busy} disabled={!amount || (sheet === 'collect' && !orderNumber.trim())} />
      </FormSheet>

      <PickerModal
        visible={pickUser}
        title="Transfer to"
        options={users.filter(u => u.id !== me).map(u => ({ value: String(u.id), label: u.name }))}
        selected={toUser ? String(toUser.id) : null}
        onSelect={v => {
          setToUser(users.find(u => String(u.id) === v));
          setPickUser(false);
        }}
        onClose={() => setPickUser(false)}
      />
    </View>
  );
}
