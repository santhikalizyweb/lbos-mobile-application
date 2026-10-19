import React, { useLayoutEffect } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { Body, Card, Empty, ErrorState, Loading, Muted, Row, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { dateTime } from '../../utils/format';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { data, setData, error, loading, refreshing, refresh } = useApi(() => api.get('oms', '/notifications'));

  const markAll = async () => {
    try {
      await api.put('oms', '/notifications/read-all');
      const now = new Date().toISOString();
      setData((d: any) => (d ? { ...d, unread: 0, data: d.data.map((n: any) => ({ ...n, read_at: n.read_at ?? now })) } : d));
    } catch (e) {
      Alert.alert('Could not mark as read', errorMessage(e));
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        data?.unread ? (
          <Pressable onPress={markAll} hitSlop={10}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Mark all read</Text>
          </Pressable>
        ) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, data?.unread]);

  const open = (n: any) => {
    if (!n.read_at) {
      api.put('oms', `/notifications/${n.id}/read`).catch(() => {});
      setData((d: any) =>
        d
          ? {
              ...d,
              unread: Math.max(0, (d.unread ?? 1) - 1),
              data: d.data.map((x: any) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
            }
          : d,
      );
    }
    if (n.data?.task_id) {
      navigation.navigate('TaskDetail', { id: n.data.task_id });
    } else if (n.data?.lead_id) {
      navigation.navigate('LeadDetail', { id: n.data.lead_id });
    }
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
      data={data?.data ?? []}
      keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={<Empty text="You're all caught up." icon="🔔" />}
      renderItem={({ item }) => (
        <Card onPress={() => open(item)} style={!item.read_at ? { borderColor: colors.primary, borderWidth: 1 } : undefined}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 20, marginRight: space.md }}>{item.type === 'task' ? '✅' : item.type === 'lead_reminder' ? '🎯' : '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Title style={{ fontSize: 15 }}>{item.title}</Title>
              {item.message ? <Body style={{ marginTop: 2, fontSize: 13 }}>{item.message}</Body> : null}
              <Muted style={{ marginTop: 4, fontSize: 12 }}>{dateTime(item.created_at)}</Muted>
            </View>
            {!item.read_at ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 }} /> : null}
          </Row>
        </Card>
      )}
    />
  );
}
