import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../api/constants';
import { useApi } from '../../hooks/useApi';
import {
  Badge,
  Body,
  Button,
  Card,
  ContactActions,
  Divider,
  ErrorState,
  Field,
  FormSheet,
  KeyValue,
  Loading,
  Muted,
  PickerModal,
  Row,
  Screen,
  SectionTitle,
  Title,
} from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime, label } from '../../utils/format';

/** The full payload PUT /leads/{id} validates, from the lead as loaded. */
export function leadPayload(lead: any, changes: Record<string, any> = {}) {
  return {
    name: lead.name ?? null,
    product_name: lead.product_name,
    phones: (lead.phones ?? []).map((p: any) => p.phone),
    assigned_to: typeof lead.assigned_to === 'object' ? lead.assigned_to?.id ?? null : lead.assigned_to ?? null,
    status: lead.status,
    lost_reason: lead.lost_reason ?? null,
    ...changes,
  };
}

export default function LeadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const { data: lead, setData, error, loading, refreshing, refresh } = useApi(() => api.get('oms', `/leads/${id}`), [id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Lead',
      headerRight: () =>
        lead ? (
          <Pressable onPress={() => navigation.navigate('LeadForm', { lead })} hitSlop={10}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Edit</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, lead]);

  if (loading) {
    return <Loading />;
  }
  if (error || !lead) {
    return <ErrorState message={error ?? 'Lead not found.'} onRetry={refresh} />;
  }

  const saveStatus = async (status: string, lost_reason: string | null = null) => {
    setBusy(true);
    try {
      setData(await api.put('oms', `/leads/${id}`, leadPayload(lead, { status, lost_reason })));
      setLostOpen(false);
    } catch (e) {
      Alert.alert('Could not change status', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pickStatus = (status: string) => {
    setStatusOpen(false);
    if (status === lead.status) {
      return;
    }
    if (status === 'sales_lost') {
      setLostReason('');
      setLostOpen(true);
      return;
    }
    saveStatus(status);
  };

  const addNote = async () => {
    if (!note.trim()) {
      return;
    }
    setBusy(true);
    try {
      const created = await api.post('oms', `/leads/${id}/notes`, { body: note.trim() });
      setData({ ...lead, notes: [...(lead.notes ?? []), created] });
      setNote('');
    } catch (e) {
      Alert.alert('Could not add note', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const notes: any[] = [...(lead.notes ?? [])].reverse();
  const histories: any[] = [...(lead.histories ?? [])].reverse();
  const phones: string[] = (lead.phones ?? []).map((p: any) => p.phone);

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Title style={{ fontSize: 18, flex: 1 }}>{lead.name || 'Unnamed lead'}</Title>
            <Badge status={lead.status} text={LEAD_STATUS_LABELS[lead.status]} />
          </Row>
          <Body style={{ marginTop: 4 }}>{lead.product_name}</Body>
          <Divider />
          <KeyValue k="Assigned to" v={lead.assigned_to?.name} />
          <KeyValue k="Created by" v={lead.created_by?.name} />
          <KeyValue k="Created" v={dateTime(lead.created_at)} />
          {lead.status === 'sales_lost' ? <KeyValue k="Lost reason" v={lead.lost_reason} /> : null}
          <Button title="Change status" onPress={() => setStatusOpen(true)} loading={busy && !note} style={{ marginTop: space.md }} />
        </Card>

        <SectionTitle>Phone numbers</SectionTitle>
        {phones.map(p => (
          <Card key={p}>
            <Title>{p}</Title>
            <ContactActions phone={p} />
          </Card>
        ))}

        <SectionTitle>Notes</SectionTitle>
        <Card>
          <Field placeholder="Write a note about this call or visit…" value={note} onChangeText={setNote} multiline />
          <Button title="Add note" onPress={addNote} loading={busy && !!note} disabled={!note.trim()} />
        </Card>
        {notes.map(n => (
          <Card key={n.id}>
            {n.kind && n.kind !== 'note' ? <Badge text={label(n.kind)} color={colors.danger} /> : null}
            <Body style={{ marginTop: n.kind && n.kind !== 'note' ? space.sm : 0 }}>{n.body}</Body>
            <Muted style={{ marginTop: space.sm }}>
              {n.user?.name ?? 'Someone'} · {dateTime(n.created_at)}
            </Muted>
          </Card>
        ))}

        {histories.length ? (
          <>
            <SectionTitle>Activity</SectionTitle>
            <Card>
              {histories.map((h, i) => (
                <View key={h.id ?? i} style={{ marginBottom: i === histories.length - 1 ? 0 : space.md }}>
                  <Body>
                    {h.field === 'created' ? 'Lead created' : `${label(h.field)}: ${h.old_value ? `${label(h.old_value)} → ` : ''}${label(h.new_value)}`}
                  </Body>
                  <Muted>
                    {h.changed_by?.name ?? 'System'} · {dateTime(h.changed_at)}
                  </Muted>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </Screen>

      <PickerModal
        visible={statusOpen}
        title="Lead status"
        options={LEAD_STATUSES.map(s => ({ value: s, label: LEAD_STATUS_LABELS[s] }))}
        selected={lead.status}
        onSelect={pickStatus}
        onClose={() => setStatusOpen(false)}
      />
      <FormSheet visible={lostOpen} title="Why was this sale lost?" onClose={() => setLostOpen(false)}>
        <Field placeholder="Reason" value={lostReason} onChangeText={setLostReason} multiline />
        <Button title="Mark as Sales Lost" variant="danger" loading={busy} disabled={!lostReason.trim()} onPress={() => saveStatus('sales_lost', lostReason.trim())} />
      </FormSheet>
    </View>
  );
}
