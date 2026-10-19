import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Linking, Pressable, Share, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Badge, Body, Button, Card, Divider, KeyValue, Muted, Screen, SectionTitle, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { label, money, stripHtml } from '../../utils/format';
import { Price } from './LizymartScreen';

const WIDTH = Dimensions.get('window').width;

const isImage = (m: any) =>
  (m?.mime_type && String(m.mime_type).startsWith('image/')) || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(m?.url ?? '');

/** Specifications arrive as {key: value}, [{label|key|name, value}] or plain text. */
function specRows(specs: any): [string, string][] {
  if (!specs) {
    return [];
  }
  if (typeof specs === 'string') {
    return [['Details', stripHtml(specs)]];
  }
  if (Array.isArray(specs)) {
    return specs
      .map((r: any) => (typeof r === 'object' && r ? [String(r.label ?? r.key ?? r.name ?? ''), String(r.value ?? '')] : ['', String(r)]))
      .filter(([, v]) => v) as [string, string][];
  }
  return Object.entries(specs).map(([k, v]) => [label(k), typeof v === 'object' ? JSON.stringify(v) : String(v)]);
}

function links(value: any): { title: string; url: string }[] {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((l: any) => (typeof l === 'string' ? { title: l, url: l } : { title: l?.label ?? l?.title ?? l?.name ?? l?.url, url: l?.url ?? l?.link }))
    .filter(l => l.url);
}

/** A list-of-strings field (features, outcomes, process) or free text. */
function textList(value: any): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? v?.title ?? v?.name ?? v?.text ?? JSON.stringify(v) : String(v))).filter(Boolean);
  }
  return [stripHtml(String(value))];
}

export default function LizymartDetailScreen() {
  const navigation = useNavigation<any>();
  const { item, kind } = useRoute<any>().params;
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ title: kind === 'services' ? 'Service' : 'Product' });
  }, [navigation, kind]);

  const images = useMemo(() => {
    const urls = [item.main_image, ...(item.gallery ?? []).filter(isImage).map((g: any) => g.url)].filter(Boolean);
    return [...new Set(urls)] as string[];
  }, [item]);

  const specs = specRows(item.specifications);
  const refs = links(item.reference_links);
  const docs: any[] = [...(item.documents ?? []), ...(item.training_videos ?? [])];
  const adVideos = [...(item.ad_information?.videos ?? []).map((v: any) => v.url), ...(item.ad_information?.video_links ?? [])].filter(Boolean);

  const share = () => {
    const price = item.sale_price && Number(item.sale_price) > 0 ? item.sale_price : item.price;
    Share.share({
      message: [item.name, price ? `Price: ${money(price)}` : null, stripHtml(item.description).slice(0, 400), item.main_image].filter(Boolean).join('\n\n'),
    }).catch(() => {});
  };

  return (
    <Screen contentStyle={{ padding: 0 }}>
      {images.length ? (
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={u => u}
            onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / WIDTH))}
            renderItem={({ item: uri }) => (
              <Image source={{ uri }} style={{ width: WIDTH, height: WIDTH * 0.8, backgroundColor: colors.neutralSoft }} resizeMode="contain" />
            )}
          />
          {images.length > 1 ? (
            <Text style={{ position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontSize: 12 }}>
              {index + 1}/{images.length}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ padding: space.lg }}>
        <Card>
          <Title style={{ fontSize: 19 }}>{item.name}</Title>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
            {item.category?.name ? <Badge text={item.category.name} color={colors.primary} /> : null}
            {item.is_featured ? <Badge text="Featured" color={colors.warning} /> : null}
            {item.visibility && item.visibility !== 'public' ? <Badge text={label(item.visibility)} color={colors.muted} /> : null}
          </View>
          <Price item={item} big />
          <Divider />
          {item.brand ? <KeyValue k="Brand" v={item.brand} /> : null}
          {item.sku ? <KeyValue k="SKU" v={item.sku} /> : null}
          {item.stock_quantity !== undefined && item.stock_quantity !== null ? (
            <KeyValue k="Stock" v={<Badge text={item.stock_quantity > 0 ? `${item.stock_quantity} in stock` : 'Out of stock'} color={item.stock_quantity > 0 ? colors.success : colors.danger} />} />
          ) : null}
          {item.provider_name ? <KeyValue k="Provider" v={item.provider_name} /> : null}
          {item.pricing_type ? <KeyValue k="Pricing" v={label(item.pricing_type)} /> : null}
          <Button title="Share with customer" variant="secondary" onPress={share} style={{ marginTop: space.md }} />
        </Card>

        {item.telecalling_notes ? (
          <>
            <SectionTitle>📞 Telecalling notes</SectionTitle>
            <Card style={{ backgroundColor: colors.infoSoft, borderColor: colors.infoSoft }}>
              <Body>{stripHtml(item.telecalling_notes)}</Body>
            </Card>
          </>
        ) : null}

        {item.quotation_notes ? (
          <>
            <SectionTitle>🧾 Quotation notes</SectionTitle>
            <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
              <Body>{stripHtml(item.quotation_notes)}</Body>
            </Card>
          </>
        ) : null}

        {item.intro || item.description ? (
          <>
            <SectionTitle>Description</SectionTitle>
            <Card>
              {item.intro ? <Body style={{ fontWeight: '600', marginBottom: space.sm }}>{stripHtml(item.intro)}</Body> : null}
              {item.description ? <Body>{stripHtml(item.description)}</Body> : null}
            </Card>
          </>
        ) : null}

        {(['features', 'outcomes', 'process'] as const).map(field => {
          const rows = textList(item[field]);
          return rows.length ? (
            <View key={field}>
              <SectionTitle>{label(field)}</SectionTitle>
              <Card>
                {rows.map((r, i) => (
                  <Body key={i} style={{ marginBottom: 4 }}>
                    • {r}
                  </Body>
                ))}
              </Card>
            </View>
          ) : null;
        })}

        {specs.length ? (
          <>
            <SectionTitle>Specifications</SectionTitle>
            <Card>
              {specs.map(([k, v], i) => (
                <KeyValue key={i} k={k || '•'} v={v} />
              ))}
            </Card>
          </>
        ) : null}

        {item.knowledgebase ? (
          <>
            <SectionTitle>Knowledge base</SectionTitle>
            <Card>
              <Body>{stripHtml(typeof item.knowledgebase === 'string' ? item.knowledgebase : JSON.stringify(item.knowledgebase, null, 2))}</Body>
            </Card>
          </>
        ) : null}

        {refs.length || docs.length || adVideos.length ? (
          <>
            <SectionTitle>Links & training</SectionTitle>
            <Card>
              {[
                ...refs.map(r => ({ icon: '🔗', title: r.title, url: r.url })),
                ...docs.map(d => ({ icon: d.collection === 'documents' ? '📄' : '🎬', title: d.name ?? d.file_name ?? label(d.collection), url: d.url })),
                ...adVideos.map((u: string, i: number) => ({ icon: '📺', title: `Ad video ${i + 1}`, url: u })),
              ].map((l, i) => (
                <Pressable key={i} onPress={() => Linking.openURL(l.url).catch(() => {})} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }} numberOfLines={1}>
                    {l.icon} {l.title}
                  </Text>
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}
        <Muted style={{ textAlign: 'center' }}>Internal catalogue · synced from Lizy Admin</Muted>
      </View>
    </Screen>
  );
}
