import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../api/constants';
import { useAuth } from '../../auth/AuthContext';
import { Button, Chip, Field, Muted, PickerModal, Screen, SectionTitle, styles as ui } from '../../components/ui';
import { colors, space } from '../../theme';
import { leadPayload } from './LeadDetailScreen';

export default function LeadFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const existing = route.params?.lead;

  const [name, setName] = useState(existing?.name ?? '');
  const [product, setProduct] = useState(existing?.product_name ?? '');
  const [phones, setPhones] = useState<string[]>(existing?.phones?.length ? existing.phones.map((p: any) => p.phone) : ['']);
  const [status, setStatus] = useState(existing?.status ?? 'new');
  const [lostReason, setLostReason] = useState(existing?.lost_reason ?? '');
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | null>(
    existing ? existing.assigned_to?.id ?? null : session?.users.oms?.id ?? null,
  );
  const [users, setUsers] = useState<any[]>([]);
  const [usersFailed, setUsersFailed] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit lead' : 'New lead' });
  }, [navigation, existing]);

  useEffect(() => {
    api.get('oms', '/users').then(setUsers).catch(() => setUsersFailed(true));
  }, []);

  const setPhone = (i: number, v: string) => setPhones(list => list.map((p, j) => (j === i ? v : p)));

  const save = async () => {
    const cleanPhones = phones.map(p => p.trim()).filter(Boolean);
    if (!product.trim() || cleanPhones.length === 0) {
      Alert.alert('Missing details', 'Enter the product and at least one phone number.');
      return;
    }
    const body = {
      ...(existing ? leadPayload(existing) : {}),
      name: name.trim() || null,
      product_name: product.trim(),
      phones: cleanPhones,
      status,
      lost_reason: status === 'sales_lost' ? lostReason.trim() : null,
      assigned_to: assignedTo,
      ...(existing ? {} : { initial_note: note.trim() || null }),
    };
    setBusy(true);
    setErrors({});
    try {
      const saved = existing ? await api.put('oms', `/leads/${existing.id}`, body) : await api.post('oms', '/leads', body);
      if (existing) {
        navigation.goBack();
      } else {
        navigation.replace('LeadDetail', { id: saved.id });
      }
    } catch (e: any) {
      setErrors(e?.errors ?? {});
      Alert.alert('Could not save lead', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const assignedName = users.find(u => u.id === assignedTo)?.name ?? (assignedTo ? existing?.assigned_to?.name ?? `User #${assignedTo}` : 'Unassigned');

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Field label="Customer name" value={name} onChangeText={setName} placeholder="Optional" error={errors.name?.[0]} />
        <Field label="Product / service *" value={product} onChangeText={setProduct} error={errors.product_name?.[0]} />

        <SectionTitle>Phone numbers *</SectionTitle>
        {phones.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
            <View style={{ flex: 1 }}>
              <Field value={p} onChangeText={v => setPhone(i, v)} keyboardType="phone-pad" placeholder={`Phone ${i + 1}`} error={errors[`phones.${i}`]?.[0]} />
            </View>
            {phones.length > 1 ? (
              <Pressable onPress={() => setPhones(list => list.filter((_, j) => j !== i))} style={{ paddingTop: 10 }} hitSlop={8}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Button small variant="ghost" title="+ Add another number" onPress={() => setPhones(list => [...list, ''])} style={{ alignSelf: 'flex-start' }} />

        <SectionTitle>Status</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md }}>
          {LEAD_STATUSES.map(s => (
            <Chip key={s} text={LEAD_STATUS_LABELS[s]} selected={status === s} onPress={() => setStatus(s)} />
          ))}
        </View>
        {status === 'sales_lost' ? (
          <Field label="Why was this sale lost? *" value={lostReason} onChangeText={setLostReason} multiline error={errors.lost_reason?.[0]} />
        ) : null}

        <Text style={ui.fieldLabel}>Assigned to</Text>
        <Pressable onPress={() => setAssignOpen(true)} style={[ui.input, { paddingVertical: 12, marginBottom: space.md }]}>
          <Text style={{ color: colors.text, fontSize: 15 }}>{assignedName}</Text>
        </Pressable>

        {!existing ? <Field label="First note" value={note} onChangeText={setNote} multiline placeholder="What did the customer ask for?" /> : null}

        <Button title={existing ? 'Save changes' : 'Create lead'} onPress={save} loading={busy} style={{ marginTop: space.md }} />
        {usersFailed ? <Muted style={{ marginTop: space.md }}>Staff list unavailable; the lead keeps its current assignee.</Muted> : null}
      </Screen>

      <PickerModal
        visible={assignOpen}
        title="Assign to"
        options={[{ value: '', label: 'Unassigned' }, ...users.map(u => ({ value: String(u.id), label: u.name }))]}
        selected={assignedTo ? String(assignedTo) : ''}
        onSelect={v => {
          setAssignedTo(v ? Number(v) : null);
          setAssignOpen(false);
        }}
        onClose={() => setAssignOpen(false)}
      />
    </View>
  );
}
