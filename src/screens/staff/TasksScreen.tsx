import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../api/client';
import { useDebounced, usePaginated } from '../../hooks/useApi';
import { Badge, Card, Chip, ChipRow, Empty, ErrorState, ListFooter, Loading, Muted, Row, SearchBar, styles, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { date } from '../../utils/format';

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [overdue, setOverdue] = useState<boolean>(!!route.params?.overdue);
  // The dashboard's "Overdue tasks" card opens this tab with the filter set.
  const [seenOverdue, setSeenOverdue] = useState(route.params?.overdue);
  if (route.params?.overdue !== seenOverdue) {
    setSeenOverdue(route.params?.overdue);
    if (route.params?.overdue !== undefined) {
      setOverdue(!!route.params.overdue);
      setStatusId(null);
    }
  }
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim());

  useEffect(() => {
    api.get('oms', '/task-management/statuses').then(setStatuses).catch(() => {});
  }, []);

  const list = usePaginated<any>(
    page =>
      api.get('oms', '/task-management/tasks', {
        page,
        per_page: 20,
        search: term || undefined,
        status_id: statusId ?? undefined,
        overdue: overdue ? 1 : undefined,
      }),
    [statusId, overdue, term],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar placeholder="Search tasks" value={search} onChangeText={setSearch} />
      <ChipRow>
        <Chip
          text="All"
          selected={!statusId && !overdue}
          onPress={() => {
            setStatusId(null);
            setOverdue(false);
          }}
        />
        <Chip
          text="⚠ Overdue"
          selected={overdue}
          onPress={() => {
            setOverdue(!overdue);
            setStatusId(null);
          }}
        />
        {statuses.map(st => (
          <Chip
            key={st.id}
            text={st.name}
            selected={statusId === st.id}
            onPress={() => {
              setStatusId(statusId === st.id ? null : st.id);
              setOverdue(false);
            }}
          />
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
          ListEmptyComponent={<Empty text="No tasks here." icon="✅" />}
          ListFooterComponent={<ListFooter loading={list.loadingMore} />}
          renderItem={({ item }) => <TaskRow task={item} onPress={() => navigation.navigate('TaskDetail', { id: item.id })} />}
        />
      )}
    </View>
  );
}

export function TaskRow({ task, onPress }: { task: any; onPress: () => void }) {
  return (
    <Card onPress={onPress}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Title style={{ flex: 1, paddingRight: space.sm }} numberOfLines={2}>
          {task.name}
        </Title>
        {task.status ? <Badge text={task.status.name} color={task.status.color} status={task.status.slug} /> : null}
      </Row>
      {task.project?.name ? <Muted style={{ marginTop: 2 }}>📁 {task.project.name}</Muted> : null}
      <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
        {task.priority ? <Badge text={task.priority.name} color={task.priority.color} /> : null}
        {task.category ? <Badge text={task.category.name} color={task.category.color} /> : null}
        {task.is_overdue ? <Badge text="Overdue" color={colors.danger} /> : null}
      </Row>
      <Row style={{ justifyContent: 'space-between', marginTop: space.sm }}>
        <Muted numberOfLines={1} style={{ flex: 1 }}>
          {(task.assignees ?? []).map((a: any) => a.name).join(', ') || 'Unassigned'}
        </Muted>
        {task.due_date ? <Muted style={task.is_overdue ? { color: colors.danger, fontWeight: '700' } : undefined}>Due {date(task.due_date)}</Muted> : null}
      </Row>
      {typeof task.progress === 'number' && task.subtasks_count > 0 ? (
        <View style={{ height: 4, backgroundColor: colors.neutralSoft, borderRadius: 2, marginTop: space.sm }}>
          <View style={{ height: 4, width: `${Math.min(100, task.progress)}%`, backgroundColor: colors.success, borderRadius: 2 }} />
        </View>
      ) : null}
    </Card>
  );
}
