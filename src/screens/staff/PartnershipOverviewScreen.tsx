import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Badge, Body, Button, Card, Chip, ChipRow, Divider, Empty, ErrorState, KeyValue, Loading, Muted, Row, Screen, SectionTitle, StatCard, StatGrid, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, dateTime, label, money } from '../../utils/format';

export default function PartnershipOverviewScreen() {
  const { session } = useAuth();
  const permissions: string[] = session?.users.partnership?.permissions ?? [];
  const canApprove = permissions.includes('commissions.approve');
  const [tab, setTab] = useState<'overview' | 'commissions'>('overview');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ChipRow>
        <Chip text="Overview" selected={tab === 'overview'} onPress={() => setTab('overview')} />
        <Chip text="Pending commissions" selected={tab === 'commissions'} onPress={() => setTab('commissions')} />
      </ChipRow>
      {tab === 'overview' ? <Overview /> : <Commissions canApprove={canApprove} />}
    </View>
  );
}

function Overview() {
  const { data: d, error, loading, refreshing, refresh } = useApi(() => api.get('partnership', '/v1/dashboard'));

  if (loading) {
    return <Loading />;
  }
  if (error || !d) {
    return <ErrorState message={error ?? 'Could not load.'} onRetry={refresh} />;
  }
  const m = d.money ?? {};

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: space.sm }}>
      <StatGrid>
        <StatCard label="Partners" value={d.total_partners ?? 0} sub={`${d.active_partners ?? 0} active`} />
        <StatCard label="Applications" value={d.pending_applications ?? 0} accent={colors.warning} sub="Awaiting verification" />
        <StatCard label="Open assignments" value={d.pending_assignments ?? 0} accent={colors.info} />
        <StatCard label="Pending commissions" value={d.pending_commissions ?? 0} accent={colors.danger} />
      </StatGrid>

      <SectionTitle>Money</SectionTitle>
      <StatGrid>
        <StatCard label="To pay" value={money(m.total_to_pay)} accent={colors.danger} sub={`Commissions ${money(m.commissions_to_pay)}`} />
        <StatCard label="To collect" value={money(m.total_to_collect)} accent={colors.success} sub={`Commissions ${money(m.commissions_to_collect)}`} />
        <StatCard label="Paid out (month)" value={money(m.paid_out_this_month)} accent="#7C3AED" />
        <StatCard label="Collected (month)" value={money(m.collected_this_month)} accent="#0891B2" />
      </StatGrid>
      <Card>
        <KeyValue k="Supplier bills" v={money(m.supplier_bills_to_pay)} />
        <KeyValue k="Reseller bills" v={money(m.reseller_bills_to_collect)} />
        <KeyValue k="Awaiting approval" v={`${m.awaiting_approval_count ?? 0} (${money(m.awaiting_approval_to_pay)} to pay)`} />
        <KeyValue k="Pending settlements" v={String(d.pending_settlements ?? 0)} />
      </Card>

      {d.top_performing_partners?.length ? (
        <>
          <SectionTitle>Top partners</SectionTitle>
          <Card>
            {d.top_performing_partners.map((p: any, i: number) => (
              <View key={p.partner_id}>
                {i > 0 ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '600' }}>{p.partner?.name ?? `Partner #${p.partner_id}`}</Body>
                    <Muted>{p.partner?.partner_code}</Muted>
                  </View>
                  <Title style={{ color: colors.primary }}>{money(p.total)}</Title>
                </Row>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {d.expiring_documents?.length ? (
        <>
          <SectionTitle>Documents expiring soon</SectionTitle>
          <Card>
            {d.expiring_documents.map((doc: any, i: number) => (
              <View key={doc.id ?? i}>
                {i > 0 ? <Divider /> : null}
                <Body style={{ fontWeight: '600' }}>{doc.partner?.name ?? 'Partner'}</Body>
                <Muted>
                  {doc.document_type?.name ?? 'Document'} · expires {date(doc.expiry_date)}
                </Muted>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {d.recent_activity?.length ? (
        <>
          <SectionTitle>Recent activity</SectionTitle>
          <Card>
            {d.recent_activity.map((a: any, i: number) => (
              <View key={a.id} style={{ marginBottom: i === d.recent_activity.length - 1 ? 0 : space.sm }}>
                <Body>{a.description}</Body>
                <Muted style={{ fontSize: 12 }}>{dateTime(a.created_at)}</Muted>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Commissions({ canApprove }: { canApprove: boolean }) {
  const { data, setData, error, loading, refreshing, refresh } = useApi(() =>
    api.get('partnership', '/v1/commissions', { status: 'pending', per_page: 50 }),
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const act = (c: any, action: 'approve' | 'reject') =>
    Alert.alert(action === 'approve' ? 'Approve commission' : 'Reject commission', `${label(action)} ${money(c.commission_amount)} for ${c.partner?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label(action),
        style: action === 'reject' ? 'destructive' : 'default',
        onPress: async () => {
          setBusyId(c.id);
          try {
            await api.post('partnership', `/v1/commissions/${c.id}/${action}`);
            setData((prev: any) => (prev ? { ...prev, data: prev.data.filter((x: any) => x.id !== c.id) } : prev));
          } catch (e) {
            Alert.alert('Could not update', errorMessage(e));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }
  const rows: any[] = data?.data ?? [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: space.sm }}>
      {rows.length === 0 ? <Empty text="No commissions are waiting for approval." icon="🤝" /> : null}
      {rows.map(c => (
        <Card key={c.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Title style={{ flex: 1 }} numberOfLines={1}>
              {c.partner?.name ?? 'Partner'}
            </Title>
            <Title style={{ color: c.direction === 'from_partner' ? colors.success : colors.danger }}>{money(c.commission_amount)}</Title>
          </Row>
          <Muted>
            {c.partner?.partner_code} · {c.direction === 'from_partner' ? 'Partner pays us' : 'We pay partner'}
          </Muted>
          <Muted style={{ marginTop: 4 }}>
            {[
              c.oms_order_number && `Order ${c.oms_order_number}`,
              c.sale?.product_name,
              c.assignment?.title,
              c.base_amount && `on ${money(c.base_amount)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Muted>
          <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
            <Badge status={c.status} />
            <Muted style={{ fontSize: 12 }}>{date(c.created_at)}</Muted>
          </Row>
          {canApprove ? (
            <Row style={{ gap: space.sm, marginTop: space.md }}>
              <Button small title="Approve" onPress={() => act(c, 'approve')} loading={busyId === c.id} style={{ flex: 1 }} />
              <Button small variant="secondary" title="Reject" onPress={() => act(c, 'reject')} disabled={busyId === c.id} style={{ flex: 1 }} />
            </Row>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
