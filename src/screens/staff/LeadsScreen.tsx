import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../api/client';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../api/constants';
import { useDebounced, usePaginated, useParamState } from '../../hooks/useApi';
import { Badge, Card, Chip, ChipRow, Empty, ErrorState, Fab, ListFooter, Loading, Muted, Row, SearchBar, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime } from '../../utils/format';

export default function LeadsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [status, setStatus] = useParamState<string | null>(route.params?.status, null);
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());

  const list = usePaginated<any>(
    page => api.get('oms', '/leads', { page, per_page: 20, search: term || undefined, status: status ? [status] : undefined }),
    [status, term],
  );
  const stats = list.raw?.stats ?? {};

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar placeholder="Search name, product, phone or notes" value={search} onChangeText={setSearch} />
      <ChipRow>
        <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
        {LEAD_STATUSES.map(st => (
          <Chip key={st} text={LEAD_STATUS_LABELS[st]} count={stats[st]} selected={status === st} onPress={() => setStatus(status === st ? null : st)} />
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
          contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
          refreshing={list.refreshing}
          onRefresh={list.refresh}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Empty text="No leads match." icon="🎯" />}
          ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          renderItem={({ item }) => (
            <Card onPress={() => navigation.navigate('LeadDetail', { id: item.id })}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title style={{ flex: 1 }} numberOfLines={1}>
                  {item.name || item.phones?.[0]?.phone || 'Unnamed lead'}
                </Title>
                <Badge status={item.status} text={LEAD_STATUS_LABELS[item.status]} />
              </Row>
              <Muted style={{ marginTop: 2, color: colors.text }}>{item.product_name}</Muted>
              <Muted style={{ marginTop: 2 }}>
                {(item.phones ?? []).map((p: any) => p.phone).join(', ')}
                {item.assigned_to?.name ? ` · ${item.assigned_to.name}` : ''}
              </Muted>
              {item.latest_note?.body ? (
                <Muted numberOfLines={2} style={{ marginTop: space.sm, fontStyle: 'italic' }}>
                  “{item.latest_note.body}”
                </Muted>
              ) : null}
              <Muted style={{ marginTop: space.sm, fontSize: 11 }}>Updated {dateTime(item.updated_at)}</Muted>
            </Card>
          )}
        />
      )}
      <Fab onPress={() => navigation.navigate('LeadForm')} />
    </View>
  );
}
