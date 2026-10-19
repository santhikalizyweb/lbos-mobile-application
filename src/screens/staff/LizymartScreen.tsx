import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Chip, ChipRow, Empty, ErrorState, Loading, Muted, SearchBar, styles as ui } from '../../components/ui';
import { colors, radius, space } from '../../theme';
import { money } from '../../utils/format';

type Kind = 'products' | 'services';

export default function LizymartScreen() {
  const navigation = useNavigation<any>();
  const [kind, setKind] = useState<Kind>('products');
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, error, loading, refreshing, refresh } = useApi(() => api.get('oms', `/lizymart/${kind}`), [kind]);
  const items: any[] = useMemo(() => data?.data ?? [], [data]);
  const syncFailed = data?.meta?.lizy_admin_sync === 'failed';

  const categories = useMemo(() => {
    const names = new Set<string>();
    items.forEach(i => i.category?.name && names.add(i.category.name));
    return [...names].sort();
  }, [items]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      i =>
        (!category || i.category?.name === category) &&
        (!term || [i.name, i.brand, i.sku, i.provider_name, i.category?.name].some(v => v && String(v).toLowerCase().includes(term))),
    );
  }, [items, category, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.segment}>
        {(['products', 'services'] as Kind[]).map(k => (
          <Pressable
            key={k}
            onPress={() => {
              setKind(k);
              setCategory(null);
            }}
            style={[s.segmentItem, kind === k && s.segmentActive]}>
            <Text style={[s.segmentText, kind === k && s.segmentTextActive]}>{k === 'products' ? 'Products' : 'Services'}</Text>
          </Pressable>
        ))}
      </View>
      <SearchBar placeholder={`Search ${kind}`} value={search} onChangeText={setSearch} />
      {categories.length > 1 ? (
        <ChipRow>
          <Chip text="All" selected={!category} onPress={() => setCategory(null)} />
          {categories.map(c => (
            <Chip key={c} text={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ChipRow>
      ) : null}
      {syncFailed ? <Text style={s.notice}>Lizy Admin could not be reached; showing the last saved copy.</Text> : null}

      {loading ? (
        <Loading text="Loading catalogue…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={shown}
          key={kind}
          numColumns={2}
          keyExtractor={item => String(item.id)}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={[ui.listContent, { paddingTop: space.md }]}
          refreshing={refreshing}
          onRefresh={refresh}
          initialNumToRender={10}
          ListEmptyComponent={<Empty text={`No ${kind} found.`} icon="🛍️" />}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [s.tile, pressed && { opacity: 0.8 }]} onPress={() => navigation.navigate('LizymartDetail', { item, kind })}>
              {item.main_image ? (
                <Image source={{ uri: item.main_image }} style={s.image} resizeMode="cover" />
              ) : (
                <View style={[s.image, s.placeholder]}>
                  <Text style={{ fontSize: 32 }}>{kind === 'products' ? '📦' : '🛠️'}</Text>
                </View>
              )}
              <View style={{ padding: space.sm }}>
                <Text style={s.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Muted numberOfLines={1} style={{ fontSize: 11 }}>
                  {item.category?.name ?? item.brand ?? item.provider_name ?? ''}
                </Muted>
                <Price item={item} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

export function Price({ item, big }: { item: any; big?: boolean }) {
  const sale = item.sale_price && Number(item.sale_price) > 0 && Number(item.sale_price) < Number(item.price);
  if (!item.price && !item.sale_price) {
    return <Muted style={{ marginTop: 4 }}>{item.pricing_type ? item.pricing_type : 'Price on request'}</Muted>;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 4, gap: 6 }}>
      <Text style={[s.price, big && { fontSize: 22 }]}>{money(sale ? item.sale_price : item.price)}</Text>
      {sale ? <Text style={s.strike}>{money(item.price)}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.neutralSoft, borderRadius: radius.sm, padding: 4, marginHorizontal: space.lg, marginTop: space.md },
  segmentItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentTextActive: { color: colors.primary, fontWeight: '800' },
  notice: { backgroundColor: colors.warningSoft, color: colors.warning, fontSize: 12, padding: space.sm, marginHorizontal: space.lg, borderRadius: radius.sm },
  tile: {
    flex: 1,
    maxWidth: '50%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.neutralSoft },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '700', color: colors.text, minHeight: 34 },
  price: { fontSize: 14, fontWeight: '800', color: colors.primary },
  strike: { fontSize: 11, color: colors.faint, textDecorationLine: 'line-through' },
});
