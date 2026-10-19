import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Badge, Card, Chip, ChipRow, Empty, ErrorState, Loading, Muted, Row, Screen, SectionTitle, StatCard, StatGrid, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, label, money } from '../../utils/format';

export default function PartnerEarningsScreen() {
  const [status, setStatus] = useState<string | null>(null);
  const { data, error, loading, refreshing, refresh } = useApi(async () => {
    const [summary, transactions] = await Promise.all([
      api.get('partnership', '/v1/partner/earnings/summary'),
      api.get('partnership', '/v1/partner/earnings/transactions'),
    ]);
    return { summary, transactions: (transactions ?? []) as any[] };
  });

  const statuses = useMemo(() => [...new Set((data?.transactions ?? []).map(t => t.status).filter(Boolean))] as string[], [data]);
  const rows = (data?.transactions ?? []).filter(t => !status || t.status === status);

  if (loading) {
    return <Loading />;
  }
  if (error || !data) {
    return <ErrorState message={error ?? 'Could not load earnings.'} onRetry={refresh} />;
  }

  const o = data.summary?.overall ?? {};
  const byType: any[] = Array.isArray(data.summary?.by_type) ? data.summary.by_type : Object.values(data.summary?.by_type ?? {});

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <StatGrid>
        <StatCard label="Total earnings" value={money(o.total_earnings)} accent={colors.primary} />
        <StatCard label="Paid" value={money(o.paid_earnings)} accent={colors.success} />
        <StatCard label="Pending" value={money(o.pending_earnings)} accent={colors.warning} />
        <StatCard label="Business generated" value={money(o.total_revenue)} accent={colors.info} />
      </StatGrid>

      {byType.length > 1 ? (
        <>
          <SectionTitle>By partner type</SectionTitle>
          {byType.map((t, i) => (
            <Card key={t.enrollment_id ?? i}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title>{t.partner_type_name}</Title>
                {t.enrollment_status ? <Badge status={t.enrollment_status} /> : null}
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
                <Muted>Earned {money(t.total_earnings)}</Muted>
                <Muted>Paid {money(t.paid_earnings)}</Muted>
                <Muted>Pending {money(t.pending_earnings)}</Muted>
              </Row>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle>Transactions</SectionTitle>
      {statuses.length > 1 ? (
        <View style={{ marginHorizontal: -space.lg }}>
          <ChipRow>
            <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
            {statuses.map(s => (
              <Chip key={s} text={label(s)} selected={status === s} onPress={() => setStatus(status === s ? null : s)} />
            ))}
          </ChipRow>
        </View>
      ) : null}
      {rows.length === 0 ? <Empty text="No earnings yet." icon="💰" /> : null}
      {rows.map((t, i) => (
        <Card key={`${t.reference}-${i}`}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Title style={{ flex: 1, fontSize: 15 }} numberOfLines={1}>
              {t.type === 'reseller_margin' ? 'Resale margin' : 'Commission'}
              {t.enrollment_type ? ` · ${label(t.enrollment_type)}` : ''}
            </Title>
            <Title style={{ color: colors.success }}>{money(t.earning)}</Title>
          </Row>
          <Muted style={{ marginTop: 2 }}>
            {[t.reference, t.business_source, `on ${money(t.revenue)}`].filter(Boolean).join(' · ')}
          </Muted>
          <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
            <Badge status={t.status} />
            <Muted style={{ fontSize: 12 }}>{date(t.date)}</Muted>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
