import React, { useLayoutEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { ORDER_STATUSES } from '../../api/constants';
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
import { date, dateTime, label, money } from '../../utils/format';

const HISTORY_LABELS: Record<string, string> = {
  order_status: 'Status',
  payment_status: 'Payment',
  paid_amount: 'Paid amount',
  tracking_number: 'Tracking #',
  courier_name: 'Courier',
};

const RETURN_FIELDS = [
  { key: 'return_tracking_number', label: 'Return tracking number' },
  { key: 'return_courier_name', label: 'Return courier' },
  { key: 'return_shipping_phone', label: 'Return phone', phone: true },
  { key: 'return_shipping_address', label: 'Return address', multiline: true },
  { key: 'return_reason', label: 'Reason for return', multiline: true },
];

/** Relations and columns share names in Laravel's JSON (assigned_to, changed_by). */
const nameOf = (v: any) => (v && typeof v === 'object' ? v.name : null);

export default function OrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const { data: order, setData, error, loading, refreshing, refresh } = useApi(() => api.get('oms', `/orders/${id}`), [id]);

  const [statusOpen, setStatusOpen] = useState(false);
  const [sheet, setSheet] = useState<'payment' | 'shipping' | 'return' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: order?.order_number ?? 'Order' });
  }, [navigation, order?.order_number]);

  if (loading) {
    return <Loading />;
  }
  if (error || !order) {
    return <ErrorState message={error ?? 'Order not found.'} onRetry={refresh} />;
  }

  const merge = (fresh: any) => setData({ ...order, ...fresh, status_history: order.status_history });

  const run = async (fn: () => Promise<any>, after?: () => void) => {
    setBusy(true);
    try {
      merge(await fn());
      after?.();
      refresh();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pickStatus = (next: string) => {
    setStatusOpen(false);
    if (next === order.order_status) {
      return;
    }
    if (next === 'replacement_pending') {
      Alert.alert('Replacement', 'Starting a replacement needs the replacement products. Please do this from the OMS web portal.');
      return;
    }
    if (next === 'ready_to_return') {
      setForm(Object.fromEntries(RETURN_FIELDS.map(f => [f.key, order[f.key] ?? ''])));
      setSheet('return');
      return;
    }
    Alert.alert('Change status', `Move this order to "${label(next)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change', onPress: () => run(() => api.patch('oms', `/orders/${id}/status`, { order_status: next })) },
    ]);
  };

  const openPayment = () => {
    setForm({ paid_amount: String(Number(order.paid_amount ?? 0)) });
    setSheet('payment');
  };

  const openShipping = () => {
    setForm({
      courier_name: order.courier_name ?? '',
      tracking_number: order.tracking_number ?? '',
      shipping_phone: order.shipping_phone ?? '',
      shipping_address: order.shipping_address ?? '',
    });
    setSheet('shipping');
  };

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const close = () => setSheet(null);

  const items: any[] = order.items ?? [];
  const history: any[] = [...(order.status_history ?? [])].sort(
    (a, b) => new Date(b.changed_at ?? b.created_at).getTime() - new Date(a.changed_at ?? a.created_at).getTime(),
  );

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Title style={{ fontSize: 18 }}>{order.order_number}</Title>
            <Badge status={order.order_status} />
          </Row>
          <Muted style={{ marginTop: 4 }}>
            Created {dateTime(order.created_at)}
            {order.invoice_number ? ` · Invoice ${order.invoice_number}` : ''}
          </Muted>
          <Row style={{ gap: space.sm, marginTop: space.md }}>
            <Button small title="Change status" onPress={() => setStatusOpen(true)} style={{ flex: 1 }} />
            <Button small variant="secondary" title="Payment" onPress={openPayment} style={{ flex: 1 }} />
            <Button small variant="secondary" title="Shipping" onPress={openShipping} style={{ flex: 1 }} />
          </Row>
        </Card>

        <SectionTitle>Amount</SectionTitle>
        <Card>
          <KeyValue k="Total" v={money(order.total_amount)} />
          <KeyValue k="Paid" v={money(order.paid_amount)} />
          <KeyValue k="Balance" v={<Title style={{ color: Number(order.balance_amount) > 0 ? colors.danger : colors.success }}>{money(order.balance_amount)}</Title>} />
          <KeyValue k="Payment" v={<Badge status={order.payment_status} />} />
        </Card>

        <SectionTitle>Customer</SectionTitle>
        <Card>
          <Title>{order.customer_name}</Title>
          <Muted style={{ marginTop: 2 }}>
            {order.customer_phone}
            {order.customer?.type ? ` · ${label(order.customer.type)}` : ''}
          </Muted>
          {order.customer_address ? <Body style={{ marginTop: space.sm }}>{order.customer_address}</Body> : null}
          <ContactActions phone={order.customer_phone} />
        </Card>

        <SectionTitle>Items</SectionTitle>
        <Card>
          {items.length === 0 ? <Muted>No items.</Muted> : null}
          {items.map((item, i) => (
            <View key={item.id ?? i}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: space.md }}>
                  <Body style={{ fontWeight: '600' }}>{item.product_name}</Body>
                  <Muted>
                    {item.quantity} × {money(item.unit_price)}
                  </Muted>
                  {item.supplier_name ? <Muted>Supplier: {item.supplier_name}</Muted> : null}
                </View>
                <Body style={{ fontWeight: '700' }}>{money(item.subtotal)}</Body>
              </Row>
            </View>
          ))}
        </Card>

        <SectionTitle>Shipping</SectionTitle>
        <Card>
          <KeyValue k="Courier" v={order.courier_name} />
          <KeyValue k="Tracking #" v={order.tracking_number} />
          <KeyValue k="Ship to phone" v={order.shipping_phone} />
          <KeyValue k="Ship to" v={order.shipping_address} />
          {order.return_reason ? (
            <>
              <Divider />
              <KeyValue k="Return courier" v={order.return_courier_name} />
              <KeyValue k="Return tracking" v={order.return_tracking_number} />
              <KeyValue k="Return reason" v={order.return_reason} />
            </>
          ) : null}
        </Card>

        <SectionTitle>Other details</SectionTitle>
        <Card>
          <KeyValue k="Category" v={order.category?.name} />
          <KeyValue k="Assigned to" v={nameOf(order.assigned_to)} />
          <KeyValue k="Sourcing" v={[order.sourcing_company_name, order.sourcing_company_phone].filter(Boolean).join(' · ')} />
          <KeyValue k="Affiliate" v={order.affiliate_partner_name} />
          {order.commission ? <KeyValue k="Commission" v={`${money(order.commission.commission_amount)} (${label(order.commission.status)})`} /> : null}
          <KeyValue k="Notes" v={order.notes} />
        </Card>

        {history.length ? (
          <>
            <SectionTitle>History</SectionTitle>
            <Card>
              {history.map((h, i) => (
                <View key={h.id ?? i} style={{ marginBottom: i === history.length - 1 ? 0 : space.md }}>
                  <Body>
                    <Body style={{ fontWeight: '700' }}>{HISTORY_LABELS[h.field] ?? label(h.field)}</Body>
                    {': '}
                    {h.old_value ? `${fmtHistory(h.field, h.old_value)} → ` : ''}
                    {fmtHistory(h.field, h.new_value)}
                  </Body>
                  <Muted>
                    {nameOf(h.changed_by) ?? 'System'} · {dateTime(h.changed_at ?? h.created_at)}
                  </Muted>
                </View>
              ))}
            </Card>
          </>
        ) : null}
        <Muted style={{ textAlign: 'center', marginTop: space.md }}>Last updated {date(order.updated_at)}</Muted>
      </Screen>

      <PickerModal
        visible={statusOpen}
        title="Order status"
        options={ORDER_STATUSES.map(s => ({ value: s, label: label(s) }))}
        selected={order.order_status}
        onSelect={pickStatus}
        onClose={() => setStatusOpen(false)}
      />

      <FormSheet visible={sheet === 'payment'} title="Update payment" onClose={close}>
        <Muted style={{ marginBottom: space.md }}>Order total {money(order.total_amount)}. The payment status is worked out from the amount paid.</Muted>
        <Field label="Total amount paid (₹)" value={form.paid_amount} onChangeText={set('paid_amount')} keyboardType="decimal-pad" />
        <Button
          title="Save payment"
          loading={busy}
          onPress={() => run(() => api.patch('oms', `/orders/${id}/payment`, { paid_amount: Number(form.paid_amount || 0) }), close)}
        />
      </FormSheet>

      <FormSheet visible={sheet === 'shipping'} title="Shipping details" onClose={close}>
        <Field label="Courier" value={form.courier_name} onChangeText={set('courier_name')} />
        <Field label="Tracking number" value={form.tracking_number} onChangeText={set('tracking_number')} autoCapitalize="characters" />
        <Field label="Shipping phone" value={form.shipping_phone} onChangeText={set('shipping_phone')} keyboardType="phone-pad" />
        <Field label="Shipping address" value={form.shipping_address} onChangeText={set('shipping_address')} multiline />
        <Button title="Save shipping" loading={busy} onPress={() => run(() => api.patch('oms', `/orders/${id}/shipping`, form), close)} />
      </FormSheet>

      <FormSheet visible={sheet === 'return'} title="Ready to return" onClose={close}>
        <Muted style={{ marginBottom: space.md }}>All return details are required.</Muted>
        {RETURN_FIELDS.map(f => (
          <Field
            key={f.key}
            label={f.label}
            value={form[f.key]}
            onChangeText={set(f.key)}
            multiline={f.multiline}
            keyboardType={f.phone ? 'phone-pad' : 'default'}
          />
        ))}
        <Button
          title="Move to Ready to Return"
          loading={busy}
          onPress={() => run(() => api.patch('oms', `/orders/${id}/status`, { order_status: 'ready_to_return', ...form }), close)}
        />
      </FormSheet>
    </View>
  );
}

function fmtHistory(field: string, value: any) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (field === 'paid_amount' || field === 'total_amount') {
    return money(value);
  }
  if (field.endsWith('status')) {
    return label(value);
  }
  return String(value);
}
