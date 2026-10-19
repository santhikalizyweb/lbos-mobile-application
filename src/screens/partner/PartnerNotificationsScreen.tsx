import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { api } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Body, Card, Empty, ErrorState, Loading, Muted, Row, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime, label } from '../../utils/format';

/** Laravel database notifications: {id, type, data: {...}, read_at, created_at}. */
export default function PartnerNotificationsScreen() {
  const { data, setData, error, loading, refreshing, refresh } = useApi<any[]>(() => api.get('partnership', '/v1/notifications'));

  const markRead = (n: any) => {
    if (n.read_at) {
      return;
    }
    api.post('partnership', `/v1/notifications/${n.id}/read`).catch(() => {});
    setData(list => (list ?? []).map(x => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={data ?? []}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={<Empty text="No notifications yet." icon="🔔" />}
      renderItem={({ item }) => {
        const d = item.data ?? {};
        const title = d.title ?? label(d.type ?? String(item.type ?? '').split('\\').pop()?.replace(/Notification$/, ''));
        return (
          <Card onPress={() => markRead(item)} style={!item.read_at ? { borderColor: colors.primary, borderWidth: 1 } : undefined}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 20, marginRight: space.md }}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Title style={{ fontSize: 15 }}>{title}</Title>
                {d.message ? <Body style={{ marginTop: 2, fontSize: 13 }}>{d.message}</Body> : null}
                <Muted style={{ marginTop: 4, fontSize: 12 }}>{dateTime(item.created_at)}</Muted>
              </View>
              {!item.read_at ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} /> : null}
            </Row>
          </Card>
        );
      }}
    />
  );
}
