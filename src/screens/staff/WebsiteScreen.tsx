import React, { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { api, errorMessage } from '../../api/client';
import { ENQUIRY_STATUSES } from '../../api/constants';
import { useApi, useDebounced, usePaginated } from '../../hooks/useApi';
import {
  Badge,
  Body,
  Button,
  Card,
  Chip,
  ChipRow,
  ContactActions,
  Empty,
  ErrorState,
  ListFooter,
  Loading,
  Muted,
  PickerModal,
  Row,
  Screen,
  SearchBar,
  StatCard,
  StatGrid,
  styles,
  Title,
} from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime, label } from '../../utils/format';

const MODULES: { key: string; label: string; accent: string }[] = [
  { key: 'products', label: 'Products', accent: colors.primary },
  { key: 'services', label: 'Services', accent: colors.info },
  { key: 'properties', label: 'Properties', accent: '#7C3AED' },
  { key: 'tour_packages', label: 'Tour packages', accent: '#0891B2' },
  { key: 'vehicles', label: 'Vehicles', accent: colors.warning },
];

export default function WebsiteScreen() {
  const [tab, setTab] = useState<'enquiries' | 'content'>('enquiries');
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ChipRow>
        <Chip text="Enquiries" selected={tab === 'enquiries'} onPress={() => setTab('enquiries')} />
        <Chip text="Content overview" selected={tab === 'content'} onPress={() => setTab('content')} />
      </ChipRow>
      {tab === 'enquiries' ? <Enquiries /> : <Content />}
    </View>
  );
}

function Content() {
  const { data, error, loading, refreshing, refresh } = useApi(async () => (await api.get('universal', '/admin/dashboard')).data);
  if (loading) {
    return <Loading />;
  }
  if (error || !data) {
    return <ErrorState message={error ?? 'Could not load.'} onRetry={refresh} />;
  }
  return (
    <Screen refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingTop: space.sm }}>
      <StatGrid>
        <StatCard label="Enquiries" value={data.enquiries?.total ?? 0} sub={`${data.enquiries?.new ?? 0} unread`} accent={colors.danger} />
      </StatGrid>
      {MODULES.map(m =>
        data[m.key] ? (
          <Card key={m.key}>
            <Title>{m.label}</Title>
            <Row style={{ gap: space.lg, marginTop: space.sm }}>
              {(['total', 'published', 'draft', 'featured'] as const).map(k => (
                <View key={k}>
                  <Title style={{ fontSize: 20, color: k === 'total' ? m.accent : colors.text }}>{data[m.key][k] ?? 0}</Title>
                  <Muted style={{ fontSize: 11 }}>{label(k)}</Muted>
                </View>
              ))}
            </Row>
          </Card>
        ) : null,
      )}
    </Screen>
  );
}

function Enquiries() {
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());
  const [editing, setEditing] = useState<any>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const list = usePaginated<any>(
    page => api.get('universal', '/admin/enquiries', { page, per_page: 20, q: term || undefined, status: status ?? undefined }),
    [status, term],
  );

  const expand = (e: any) => {
    setExpanded(expanded === e.id ? null : e.id);
    if (e.is_new) {
      // Opening an enquiry marks it read on the server.
      api.get('universal', `/admin/enquiries/${e.id}`).catch(() => {});
      list.setItems(items => items.map(i => (i.id === e.id ? { ...i, is_new: false } : i)));
    }
  };

  const setEnquiryStatus = async (value: string) => {
    const e = editing;
    setEditing(null);
    try {
      const res = await api.put('universal', `/admin/enquiries/${e.id}`, { status: value });
      list.setItems(items => items.map(i => (i.id === e.id ? { ...i, ...(res?.data ?? { status: value }) } : i)));
    } catch (err) {
      Alert.alert('Could not update', errorMessage(err));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SearchBar placeholder="Search name, phone, email or message" value={search} onChangeText={setSearch} />
      <ChipRow>
        <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
        {ENQUIRY_STATUSES.map(s => (
          <Chip key={s} text={label(s)} selected={status === s} onPress={() => setStatus(status === s ? null : s)} />
        ))}
      </ChipRow>
      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.refresh} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshing={list.refreshing}
          onRefresh={list.refresh}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Empty text="No enquiries." icon="📨" />}
          ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          renderItem={({ item }) => (
            <Card onPress={() => expand(item)} style={item.is_new ? { borderColor: colors.primary, borderWidth: 1 } : undefined}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title style={{ flex: 1 }} numberOfLines={1}>
                  {item.is_new ? '● ' : ''}
                  {item.name || item.phone || item.email}
                </Title>
                <Badge status={item.status} />
              </Row>
              <Muted style={{ marginTop: 2 }}>
                {[item.enquiryable?.name, item.enquiryable_type, item.source].filter(Boolean).join(' · ')}
              </Muted>
              {item.message ? (
                <Body style={{ marginTop: space.sm }} numberOfLines={expanded === item.id ? undefined : 2}>
                  {item.message}
                </Body>
              ) : null}
              <Muted style={{ marginTop: space.sm, fontSize: 12 }}>{dateTime(item.created_at)}</Muted>
              {expanded === item.id ? (
                <>
                  <Muted style={{ marginTop: space.sm }}>{[item.phone, item.email].filter(Boolean).join(' · ')}</Muted>
                  <ContactActions phone={item.phone} email={item.email} />
                  <Button small title="Change status" onPress={() => setEditing(item)} style={{ marginTop: space.sm, alignSelf: 'flex-start' }} />
                </>
              ) : null}
            </Card>
          )}
        />
      )}
      <PickerModal
        visible={!!editing}
        title="Enquiry status"
        options={ENQUIRY_STATUSES.map(s => ({ value: s, label: label(s) }))}
        selected={editing?.status}
        onSelect={setEnquiryStatus}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}
