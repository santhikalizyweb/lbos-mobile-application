import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { api } from '../../api/client';
import { useApi, useDebounced } from '../../hooks/useApi';
import { Avatar, Badge, Body, Card, Chip, ChipRow, ContactActions, Empty, ErrorState, Loading, Muted, Row, SearchBar, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { initials, label, money } from '../../utils/format';

const TYPES = [
  { value: null, label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'reseller', label: 'Resellers' },
];

export default function CustomersScreen() {
  const [type, setType] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());
  const isPhone = /^[\d+\s-]+$/.test(term);

  const { data, error, loading, refreshing, refresh } = useApi<any[]>(
    () =>
      api.get('oms', '/customers', {
        type: type ?? undefined,
        phone: term && isPhone ? term : undefined,
        name: term && !isPhone ? term : undefined,
      }),
    [type, term],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar placeholder="Search name or phone" value={search} onChangeText={setSearch} />
      <ChipRow>
        {TYPES.map(t => (
          <Chip key={t.label} text={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
        ))}
      </ChipRow>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          initialNumToRender={15}
          ListHeaderComponent={<Muted style={{ marginBottom: space.sm }}>{(data ?? []).length} contacts</Muted>}
          ListEmptyComponent={<Empty text="No contacts found." icon="👥" />}
          renderItem={({ item }) => (
            <Card>
              <Row style={{ alignItems: 'flex-start' }}>
                <Avatar text={initials(item.name)} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Title style={{ flex: 1 }} numberOfLines={1}>
                      {item.name}
                    </Title>
                    <Badge text={label(item.type)} color={item.type === 'reseller' ? '#7C3AED' : colors.info} />
                  </Row>
                  <Muted>{item.phone}</Muted>
                  {item.address ? (
                    <Body style={{ marginTop: 4, fontSize: 13 }} numberOfLines={2}>
                      {item.address}
                    </Body>
                  ) : null}
                  {item.balance_due > 0 ? (
                    <Muted style={{ marginTop: 4, color: colors.danger, fontWeight: '700' }}>Balance due {money(item.balance_due)}</Muted>
                  ) : null}
                  <ContactActions phone={item.phone} />
                </View>
              </Row>
            </Card>
          )}
        />
      )}
    </View>
  );
}
