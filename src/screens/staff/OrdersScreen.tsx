import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../api/client';
import { ORDER_FILTERS } from '../../api/constants';
import { useDebounced, usePaginated, useParamState } from '../../hooks/useApi';
import { Badge, Card, Chip, ChipRow, Empty, ErrorState, ListFooter, Loading, Muted, Row, SearchBar, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date, label, money } from '../../utils/format';

type SearchBy = 'order_number' | 'customer_name' | 'customer_phone';

const SEARCH_BY: { value: SearchBy; label: string }[] = [
  { value: 'order_number', label: 'Order #' },
  { value: 'customer_name', label: 'Customer' },
  { value: 'customer_phone', label: 'Phone' },
];

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // Dashboard cards open this tab with a status already picked.
  const [status, setStatus] = useParamState<string | null>(route.params?.status, null);
  const [searchBy, setSearchBy] = useState<SearchBy>('order_number');
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());

  const list = usePaginated<any>(
    page =>
      api.get('oms', '/orders', {
        page,
        per_page: 20,
        order_status: status ? [status] : undefined,
        [searchBy]: term || undefined,
      }),
    [status, searchBy, term],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar
        placeholder={`Search by ${SEARCH_BY.find(x => x.value === searchBy)?.label.toLowerCase()}`}
        value={search}
        onChangeText={setSearch}
        keyboardType={searchBy === 'customer_phone' ? 'phone-pad' : 'default'}
        autoCapitalize={searchBy === 'order_number' ? 'characters' : 'words'}
      />
      <ChipRow>
        {SEARCH_BY.map(x => (
          <Chip key={x.value} text={x.label} selected={searchBy === x.value} onPress={() => setSearchBy(x.value)} />
        ))}
      </ChipRow>
      <ChipRow>
        <Chip text="All" selected={!status} onPress={() => setStatus(null)} />
        {ORDER_FILTERS.map(st => (
          <Chip key={st} text={label(st)} selected={status === st} onPress={() => setStatus(status === st ? null : st)} />
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
          ListHeaderComponent={list.raw?.total !== undefined ? <Muted style={{ marginBottom: space.sm }}>{list.raw.total} orders</Muted> : undefined}
          ListEmptyComponent={<Empty text="No orders match." icon="📦" />}
          ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          renderItem={({ item }) => <OrderRow order={item} onPress={() => navigation.navigate('OrderDetail', { id: item.id })} />}
        />
      )}
    </View>
  );
}

function OrderRow({ order, onPress }: { order: any; onPress: () => void }) {
  const products = (order.items ?? []).map((i: any) => i.product_name).filter(Boolean).join(', ');
  return (
    <Card onPress={onPress}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Title>{order.order_number}</Title>
        <Title style={{ color: colors.primary }}>{money(order.total_amount)}</Title>
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
        <Muted numberOfLines={1} style={{ flex: 1 }}>
          {order.customer_name} · {order.customer_phone}
        </Muted>
        <Muted>{date(order.created_at)}</Muted>
      </Row>
      {products ? (
        <Muted numberOfLines={1} style={{ marginTop: 4, color: colors.text }}>
          {products}
        </Muted>
      ) : null}
      <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
        <Badge status={order.order_status} />
        <Badge status={order.payment_status} text={`Payment: ${label(order.payment_status)}`} />
        {Number(order.balance_amount) > 0 ? <Badge text={`Due ${money(order.balance_amount)}`} color={colors.danger} /> : null}
      </Row>
    </Card>
  );
}
