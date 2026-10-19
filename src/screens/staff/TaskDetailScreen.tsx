import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { api, errorMessage } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import {
  Badge,
  Body,
  Button,
  Card,
  Divider,
  ErrorState,
  Field,
  KeyValue,
  Loading,
  Muted,
  PickerModal,
  Row,
  Screen,
  SectionTitle,
  Title,
} from '../../components/ui';
import { colors, space } from '../../theme';
import { date, dateTime } from '../../utils/format';

export default function TaskDetailScreen() {
  const route = useRoute<any>();
  const id = route.params?.id;
  const { data: task, setData, error, loading, refreshing, refresh } = useApi(
    async () => (await api.get('oms', `/task-management/tasks/${id}`)).data,
    [id],
  );
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('oms', '/task-management/statuses').then(setStatuses).catch(() => {});
  }, []);

  if (loading) {
    return <Loading />;
  }
  if (error || !task) {
    return <ErrorState message={error ?? 'Task not found.'} onRetry={refresh} />;
  }

  const changeStatus = async (statusId: string) => {
    setStatusOpen(false);
    if (Number(statusId) === task.status?.id) {
      return;
    }
    setBusy(true);
    try {
      setData((await api.put('oms', `/task-management/tasks/${id}/status`, { status_id: Number(statusId) })).data);
    } catch (e) {
      Alert.alert('Could not change status', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const completed = statuses.find(s => s.slug === 'completed');
  const pending = statuses.find(s => s.slug === 'pending') ?? statuses[0];

  const toggleSubtask = async (sub: any) => {
    const done = sub.status?.slug === 'completed';
    const next = done ? pending : completed;
    if (!next) {
      return;
    }
    try {
      await api.put('oms', `/task-management/tasks/${id}/subtasks/${sub.id}`, { status_id: next.id });
      refresh();
    } catch (e) {
      Alert.alert('Could not update subtask', errorMessage(e));
    }
  };

  const addComment = async () => {
    if (!comment.trim()) {
      return;
    }
    setBusy(true);
    try {
      await api.post('oms', `/task-management/tasks/${id}/comments`, { message: comment.trim() });
      setComment('');
      refresh();
    } catch (e) {
      Alert.alert('Could not add comment', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const subtasks: any[] = task.subtasks ?? [];
  const comments: any[] = [...(task.comments ?? [])].reverse();
  const attachments: any[] = task.attachments ?? [];
  const logs: any[] = [...(task.activity_logs ?? [])].reverse().slice(0, 15);

  return (
    <View style={{ flex: 1 }}>
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <Card>
          <Title style={{ fontSize: 18 }}>{task.name}</Title>
          <Row style={{ gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
            {task.status ? <Badge text={task.status.name} color={task.status.color} /> : null}
            {task.priority ? <Badge text={task.priority.name} color={task.priority.color} /> : null}
            {task.category ? <Badge text={task.category.name} color={task.category.color} /> : null}
            {task.is_overdue ? <Badge text="Overdue" color={colors.danger} /> : null}
          </Row>
          {task.description ? <Body style={{ marginTop: space.md }}>{task.description}</Body> : null}
          <Divider />
          <KeyValue k="Project" v={task.project?.name} />
          <KeyValue k="Assignees" v={(task.assignees ?? []).map((a: any) => a.name).join(', ')} />
          <KeyValue k="Start" v={task.start_date ? date(task.start_date) : null} />
          <KeyValue k="Due" v={task.due_date ? date(task.due_date) : null} />
          {task.completion_date ? <KeyValue k="Completed" v={date(task.completion_date)} /> : null}
          <KeyValue k="Created by" v={task.creator?.name} />
          <Button title="Change status" onPress={() => setStatusOpen(true)} loading={busy && !comment} style={{ marginTop: space.md }} />
        </Card>

        {subtasks.length ? (
          <>
            <SectionTitle>
              Subtasks ({subtasks.filter(s => s.status?.slug === 'completed').length}/{subtasks.length})
            </SectionTitle>
            <Card>
              {subtasks.map((sub, i) => {
                const done = sub.status?.slug === 'completed';
                return (
                  <View key={sub.id}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable onPress={() => toggleSubtask(sub)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: done ? colors.success : colors.border,
                          backgroundColor: done ? colors.success : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: space.md,
                        }}>
                        {done ? <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>✓</Text> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Body style={done ? { textDecorationLine: 'line-through', color: colors.muted } : undefined}>{sub.name}</Body>
                        <Muted>
                          {[sub.assignee?.name, sub.due_date ? `Due ${date(sub.due_date)}` : null, sub.status?.name].filter(Boolean).join(' · ')}
                        </Muted>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </>
        ) : null}

        {attachments.length ? (
          <>
            <SectionTitle>Attachments</SectionTitle>
            <Card>
              {attachments.map((a, i) => (
                <View key={a.id}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable onPress={() => a.url && Linking.openURL(a.url).catch(() => {})}>
                    <Body style={{ color: colors.primary, fontWeight: '600' }}>📎 {a.original_name}</Body>
                    <Muted>
                      {a.uploader?.name} · {dateTime(a.created_at)}
                    </Muted>
                  </Pressable>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle>Comments</SectionTitle>
        <Card>
          <Field placeholder="Write a comment…" value={comment} onChangeText={setComment} multiline />
          <Button title="Post comment" onPress={addComment} loading={busy && !!comment} disabled={!comment.trim()} />
        </Card>
        {comments.map(c => (
          <Card key={c.id}>
            <Body>{c.message}</Body>
            <Muted style={{ marginTop: space.sm }}>
              {c.user?.name} · {dateTime(c.created_at)}
            </Muted>
          </Card>
        ))}

        {logs.length ? (
          <>
            <SectionTitle>Activity</SectionTitle>
            <Card>
              {logs.map((l, i) => (
                <View key={l.id} style={{ marginBottom: i === logs.length - 1 ? 0 : space.sm }}>
                  <Body>{l.description}</Body>
                  <Muted>
                    {l.user?.name} · {dateTime(l.created_at)}
                  </Muted>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </Screen>

      <PickerModal
        visible={statusOpen}
        title="Task status"
        options={statuses.map(s => ({ value: String(s.id), label: s.name, color: s.color }))}
        selected={task.status ? String(task.status.id) : null}
        onSelect={changeStatus}
        onClose={() => setStatusOpen(false)}
      />
    </View>
  );
}
