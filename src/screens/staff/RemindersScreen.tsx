import React, { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { REMINDER_STATUSES, REMINDER_STATUS_LABELS, REMINDER_TYPE_LABELS } from '../../api/constants';
import { useDebounced, usePaginated } from '../../hooks/useApi';
import { Badge, Body, Button, Card, Chip, ChipRow, ContactActions, Empty, ErrorState, ListFooter, Loading, Muted, Row, SearchBar, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, label, money } from '../../utils/format';

export default function RemindersScreen() {
  const route = useRoute<any>();
  const [status, setStatus] = useState<string | null>(route.params?.status ?? 'today');
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());

  const list = usePaginated<any>(
    page => api.get('oms', '/reminders', { page, per_page: 20, search: term || undefined, status: status ? [status] : undefined }),
    [status, term],
  );
  const stats = list.raw?.stats ?? {};

  const toggleComplete = async (r: any) => {
    try {
      const updated = await api.patch('oms', `/reminders/${r.id}/complete`, { completed: !r.completed_at });
      list.setItems(items => items.map(i => (i.id === r.id ? updated : i)));
    } catch (e) {
      Alert.alert('Could not update reminder', errorMessage(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar placeholder="Search name, phone or details" value={search} onChangeText={setSearch} />
      <ChipRow>
        {REMINDER_STATUSES.map(st => (
          <Chip key={st} text={REMINDER_STATUS_LABELS[st]} count={stats[st]} selected={status === st} onPress={() => setStatus(status === st ? null : st)} />
        ))}
        <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
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
          ListEmptyComponent={<Empty text="No reminders here." icon="⏰" />}
          ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          renderItem={({ item }) => (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Title style={{ flex: 1 }} numberOfLines={1}>
                  {item.customer_name || item.phone}
                </Title>
                <Badge status={item.status} text={REMINDER_STATUS_LABELS[item.status] ?? label(item.status)} />
              </Row>
              <Muted style={{ marginTop: 2 }}>
                {REMINDER_TYPE_LABELS[item.reminder_type] ?? label(item.reminder_type)}
                {item.booking_status ? ` · ${label(item.booking_status)}` : ''}
              </Muted>
              {item.details ? <Body style={{ marginTop: space.sm }}>{item.details}</Body> : null}
              {item.location ? <Muted style={{ marginTop: 2 }}>📍 {item.location}</Muted> : null}
              {item.product_price ? <Muted style={{ marginTop: 2 }}>Price {money(item.product_price)}</Muted> : null}
              {item.notes ? (
                <Muted style={{ marginTop: space.sm, fontStyle: 'italic' }} numberOfLines={3}>
                  {item.notes}
                </Muted>
              ) : null}
              <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
                <Muted style={item.status === 'overdue' ? { color: colors.danger, fontWeight: '700' } : undefined}>
                  Remind {date(item.reminder_date)}
                </Muted>
                <Muted>Scheduled {date(item.scheduled_date)}</Muted>
              </Row>
              {item.assigned_to?.name ? <Muted style={{ marginTop: 2 }}>Assigned to {item.assigned_to.name}</Muted> : null}
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <ContactActions phone={item.phone} />
                <Button
                  small
                  variant={item.completed_at ? 'secondary' : 'primary'}
                  title={item.completed_at ? 'Reopen' : '✓ Done'}
                  onPress={() => toggleComplete(item)}
                />
              </Row>
            </Card>
          )}
        />
      )}
    </View>
  );
}
