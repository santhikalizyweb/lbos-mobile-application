import React, { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Badge, Body, Button, Card, Chip, ChipRow, Empty, ErrorState, Fab, Field, FormSheet, Loading, Muted, Row, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime } from '../../utils/format';

export default function TicketsScreen() {
  const { session } = useAuth();
  const isAdmin = session?.users.oms?.role === 'admin';
  const [status, setStatus] = useState<string | null>('open');
  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, setData, error, loading, refreshing, refresh } = useApi<any[]>(
    () => api.get('oms', '/tickets', { status: status ?? undefined }),
    [status],
  );

  const create = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Missing details', 'Enter a subject and a description.');
      return;
    }
    setBusy(true);
    try {
      let orderId: number | undefined;
      if (orderNumber.trim()) {
        // The filter is a partial match; prefer the exact order number.
        const found = await api.get('oms', '/orders', { order_number: orderNumber.trim(), per_page: 20 });
        const rows: any[] = found?.data ?? [];
        const wanted = orderNumber.trim().toLowerCase();
        orderId = (rows.find(o => String(o.order_number).toLowerCase() === wanted) ?? (rows.length === 1 ? rows[0] : null))?.id;
        if (!orderId) {
          throw new Error(`No order matches "${orderNumber.trim()}".`);
        }
      }
      await api.post('oms', '/tickets', { subject: subject.trim(), description: description.trim(), order_id: orderId });
      setSubject('');
      setDescription('');
      setOrderNumber('');
      setFormOpen(false);
      refresh();
    } catch (e) {
      Alert.alert('Could not raise ticket', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (t: any) => {
    try {
      const updated = await api.patch('oms', `/tickets/${t.id}/status`, { status: t.status === 'solved' ? 'open' : 'solved' });
      setData((data ?? []).map(x => (x.id === t.id ? { ...x, ...updated } : x)));
    } catch (e) {
      Alert.alert('Could not update ticket', errorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ChipRow>
        <Chip text="Open" selected={status === 'open'} onPress={() => setStatus('open')} />
        <Chip text="Solved" selected={status === 'solved'} onPress={() => setStatus('solved')} />
        <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
      </ChipRow>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={<Empty text={isAdmin ? 'No tickets.' : 'You have not raised any tickets here.'} icon="🎫" />}
          renderItem={({ item }) => (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Muted style={{ fontWeight: '700' }}>{item.ticket_number}</Muted>
                <Badge status={item.status} />
              </Row>
              <Title style={{ marginTop: 4 }}>{item.subject}</Title>
              <Body style={{ marginTop: 4 }}>{item.description}</Body>
              {item.order?.order_number || item.customer?.name ? (
                <Muted style={{ marginTop: space.sm }}>
                  {[item.order?.order_number && `Order ${item.order.order_number}`, item.customer?.name].filter(Boolean).join(' · ')}
                </Muted>
              ) : null}
              <Muted style={{ marginTop: space.sm, fontSize: 12 }}>
                Raised by {item.raised_by?.name ?? '—'} · {dateTime(item.created_at)}
              </Muted>
              {item.resolved_at ? (
                <Muted style={{ fontSize: 12 }}>
                  Solved by {item.resolved_by?.name ?? '—'} · {dateTime(item.resolved_at)}
                </Muted>
              ) : null}
              {isAdmin ? (
                <Button
                  small
                  variant={item.status === 'solved' ? 'secondary' : 'primary'}
                  title={item.status === 'solved' ? 'Reopen' : 'Mark solved'}
                  onPress={() => toggle(item)}
                  style={{ marginTop: space.md, alignSelf: 'flex-start' }}
                />
              ) : null}
            </Card>
          )}
        />
      )}
      <Fab onPress={() => setFormOpen(true)} />
      <FormSheet visible={formOpen} title="Raise a ticket" onClose={() => setFormOpen(false)}>
        <Field label="Subject *" value={subject} onChangeText={setSubject} />
        <Field label="Description *" value={description} onChangeText={setDescription} multiline />
        <Field label="Order number (optional)" value={orderNumber} onChangeText={setOrderNumber} autoCapitalize="characters" />
        <Button title="Raise ticket" onPress={create} loading={busy} />
      </FormSheet>
    </View>
  );
}
