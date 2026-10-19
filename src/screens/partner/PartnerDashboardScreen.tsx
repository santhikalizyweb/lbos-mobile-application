import React from 'react';
import { View } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Avatar, Badge, Body, Card, Divider, ErrorState, Loading, Muted, Row, Screen, SectionTitle, StatCard, StatGrid, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, initials, label, money } from '../../utils/format';

/** Keys of the type-specific dashboard blocks that are not stats. */
const SKIP = new Set(['partner', 'partner_type', 'partner_types', 'money', 'by_type', 'partner_type_id', 'partner_type_name']);

const isMoneyKey = (k: string) =>
  !k.endsWith('_count') && /(amount|balance|value|earned|earning|paid|pending|commission|revenue|owed|owe|payout|margin)/.test(k);

const ACCENTS = [colors.primary, colors.success, colors.warning, colors.info, '#7C3AED', '#0891B2', colors.danger];

export default function PartnerDashboardScreen() {
  const { session } = useAuth();
  const { data, error, loading, refreshing, refresh } = useApi(async () => {
    const dashboard = await api.get('partnership', '/v1/dashboard');
    const code = dashboard?.partner_type?.code;
    const types: string[] = (dashboard?.partner_types ?? []).map((t: any) => t.code);
    let affiliate = null;
    if (code === 'affiliate' || types.includes('affiliate')) {
      affiliate = await api.get('partnership', '/v1/me/affiliate-orders').catch(() => null);
    }
    return { dashboard, affiliate };
  });

  if (loading) {
    return <Loading />;
  }
  if (error || !data) {
    return <ErrorState message={error ?? 'Could not load your dashboard.'} onRetry={refresh} />;
  }

  const d = data.dashboard;
  const m = d.money ?? {};
  const partner = d.partner ?? {};
  const types: any[] = d.partner_types?.length ? d.partner_types : d.partner_type ? [d.partner_type] : [];

  const sections: { title: string; block: any }[] = d.by_type
    ? Object.values(d.by_type).map((b: any) => ({ title: b.partner_type_name, block: b }))
    : [{ title: 'Your activity', block: d }];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Card>
        <Row>
          <Avatar text={initials(partner.name ?? session?.users.partnership?.name)} size={52} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Title style={{ fontSize: 18 }}>{partner.name ?? session?.users.partnership?.name}</Title>
            <Muted>{partner.partner_code}</Muted>
            <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
              {partner.status ? <Badge status={partner.status} /> : null}
              {types.map(t => (
                <Badge key={t.id ?? t.code} text={t.name} color={colors.primary} />
              ))}
            </Row>
          </View>
        </Row>
      </Card>

      <SectionTitle>Money</SectionTitle>
      <StatGrid>
        <StatCard label="Owed to you" value={money(m.owed_to_you)} accent={colors.success} sub={m.waiting_approval ? `${money(m.waiting_approval)} awaiting approval` : undefined} />
        <StatCard label="You owe" value={money(m.you_owe)} accent={colors.danger} />
        <StatCard label="Paid to you" value={money(m.paid_to_you)} accent={colors.primary} />
        <StatCard label="You paid" value={money(m.you_paid)} accent={colors.info} />
      </StatGrid>

      {sections.map(({ title, block }) => (
        <TypeBlock key={title} title={title} block={block} />
      ))}

      {data.affiliate?.orders?.length ? (
        <>
          <SectionTitle>My referred orders</SectionTitle>
          {data.affiliate.orders.slice(0, 20).map((o: any) => (
            <Card key={o.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title>{o.order_number}</Title>
                <Title style={{ color: colors.primary }}>{money(o.total_amount)}</Title>
              </Row>
              <Muted>
                {o.commission_rule_name ?? 'Commission'} · {date(o.created_at)}
              </Muted>
              <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
                <Badge status={o.order_status} />
                <Badge status={o.payment_status} text={`Payment: ${label(o.payment_status)}`} />
                {o.commission ? <Badge text={`Earns ${money(o.commission.commission_amount ?? o.commission.amount)}`} color={colors.success} /> : null}
              </Row>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function TypeBlock({ title, block }: { title: string; block: any }) {
  const stats = Object.entries(block).filter(([k, v]) => !SKIP.has(k) && (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v !== '')));
  const texts = Object.entries(block).filter(([k, v]) => !SKIP.has(k) && typeof v === 'string' && isNaN(Number(v)));
  const lists = Object.entries(block).filter(([k, v]) => !SKIP.has(k) && Array.isArray(v) && v.length && typeof v[0] === 'object');

  if (!stats.length && !lists.length) {
    return null;
  }

  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {texts.length ? (
        <Card>
          {texts.map(([k, v]) => (
            <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 2 }}>
              <Muted>{label(k)}</Muted>
              <Body style={{ fontWeight: '600' }}>{String(v)}</Body>
            </Row>
          ))}
        </Card>
      ) : null}
      <StatGrid>
        {stats.map(([k, v], i) => (
          <StatCard key={k} label={label(k)} value={isMoneyKey(k) ? money(v) : String(v)} accent={ACCENTS[i % ACCENTS.length]} />
        ))}
      </StatGrid>
      {lists.map(([k, rows]) => (
        <Card key={k}>
          <Title style={{ marginBottom: space.sm }}>{label(k)}</Title>
          {(rows as any[]).slice(0, 8).map((r, i) => (
            <View key={r.id ?? i}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: space.sm }}>
                  <Body style={{ fontWeight: '600' }} numberOfLines={1}>
                    {r.product_name ?? r.title ?? r.customer_name ?? r.reference_number ?? `#${r.id}`}
                  </Body>
                  <Muted style={{ fontSize: 12 }}>
                    {[r.reference_number, r.quantity !== undefined ? `Qty ${r.quantity}` : null, date(r.supply_date ?? r.purchase_date ?? r.sale_date ?? r.due_date ?? r.created_at)]
                      .filter(x => x && x !== '—')
                      .join(' · ')}
                  </Muted>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {r.amount ?? r.sale_amount ?? r.transaction_amount ?? r.commission_amount ? (
                    <Body style={{ fontWeight: '700' }}>{money(r.amount ?? r.sale_amount ?? r.transaction_amount ?? r.commission_amount)}</Body>
                  ) : null}
                  {r.payment_status || r.status ? <Badge status={r.payment_status ?? r.status} /> : null}
                </View>
              </Row>
            </View>
          ))}
        </Card>
      ))}
    </>
  );
}
