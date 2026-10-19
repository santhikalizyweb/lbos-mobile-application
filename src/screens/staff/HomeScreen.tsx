import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useApi } from '../../hooks/useApi';
import { Avatar, Badge, Card, ErrorState, Loading, Muted, Row, Screen, SectionTitle, StatCard, StatGrid, Title } from '../../components/ui';
import { colors, space } from '../../theme';
import { initials, money } from '../../utils/format';

/** Each block loads on its own, so one failing endpoint never blanks the dashboard. */
async function settle<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const user = session?.users.oms;

  const { data, error, loading, refreshing, refresh } = useApi(async () => {
    const [orders, leads, reminders, overdueTasks, openTasks, notifications] = await Promise.all([
      settle(api.get('oms', '/orders/stats')),
      settle(api.get('oms', '/leads', { per_page: 1 })),
      settle(api.get('oms', '/reminders', { per_page: 1 })),
      settle(api.get('oms', '/task-management/tasks', { per_page: 1, overdue: 1 })),
      settle(api.get('oms', '/task-management/tasks', { per_page: 1 })),
      settle(api.get('oms', '/notifications')),
    ]);
    if (!orders && !leads && !reminders && !notifications) {
      throw new Error('Could not load the dashboard. Pull down to try again.');
    }
    return { orders, leads, reminders, overdueTasks, openTasks, notifications };
  });

  const unread = data?.notifications?.unread ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Notifications')} style={s.bell} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          {unread > 0 ? (
            <View style={s.bellBadge}>
              <Text style={s.bellBadgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
      ),
    });
  }, [navigation, unread]);

  if (loading) {
    return <Loading />;
  }
  if (error && !data) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const o = data?.orders;
  const leadStats = data?.leads?.stats;
  const remStats = data?.reminders?.stats;
  const openOrders = (orders: string) => navigation.navigate('Orders', { status: orders });

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Card>
        <Row>
          <Avatar text={initials(user?.name)} size={48} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Muted>Welcome back</Muted>
            <Title style={{ fontSize: 18 }}>{user?.name ?? 'User'}</Title>
            <Row style={{ gap: space.sm, marginTop: 4 }}>
              <Badge status={session?.accountType} text={session?.accountType === 'admin' ? 'Admin' : 'Employee'} />
              {session?.tokens.partnership ? <Badge text="Partnership" color={colors.success} /> : null}
              {session?.tokens.universal ? <Badge text="Website" color={colors.info} /> : null}
            </Row>
          </View>
        </Row>
      </Card>

      {o ? (
        <>
          <SectionTitle>Orders</SectionTitle>
          <StatGrid>
            <StatCard label="Total orders" value={o.new_orders ?? 0} accent={colors.primary} onPress={() => navigation.navigate('Orders')} />
            <StatCard
              label="Payment pending"
              value={o.payment_pending ?? 0}
              sub={money(o.amounts?.payment_pending)}
              accent={colors.warning}
            />
            <StatCard label="Ready to ship" value={o.ready_to_ship ?? 0} sub={money(o.amounts?.ready_to_ship)} accent={colors.info} onPress={() => openOrders('ready_to_ship')} />
            <StatCard label="In transit" value={o.in_transit ?? 0} sub={money(o.amounts?.in_transit)} accent="#7C3AED" onPress={() => openOrders('in_transit')} />
            <StatCard
              label="At destination"
              value={o.reached_the_destination ?? 0}
              sub={money(o.amounts?.reached_the_destination)}
              accent="#0891B2"
              onPress={() => openOrders('reached_the_destination')}
            />
            <StatCard label="Delivered" value={o.delivered ?? 0} accent={colors.success} onPress={() => openOrders('delivered')} />
          </StatGrid>
        </>
      ) : null}

      {leadStats ? (
        <>
          <SectionTitle>Leads</SectionTitle>
          <StatGrid>
            <StatCard label="New" value={leadStats.new ?? 0} accent={colors.info} onPress={() => navigation.navigate('Leads', { status: 'new' })} />
            <StatCard label="Interested" value={leadStats.interested ?? 0} accent={colors.warning} onPress={() => navigation.navigate('Leads', { status: 'interested' })} />
            <StatCard label="Won" value={leadStats.won ?? 0} accent={colors.success} onPress={() => navigation.navigate('Leads', { status: 'won' })} />
            <StatCard label="Lost" value={leadStats.sales_lost ?? 0} accent={colors.danger} onPress={() => navigation.navigate('Leads', { status: 'sales_lost' })} />
          </StatGrid>
        </>
      ) : null}

      <SectionTitle>Today</SectionTitle>
      <StatGrid>
        {remStats ? (
          <>
            <StatCard label="Today's reminders" value={remStats.today ?? 0} accent={colors.primary} onPress={() => navigation.navigate('Reminders', { status: 'today' })} />
            <StatCard label="Overdue reminders" value={remStats.overdue ?? 0} accent={colors.danger} onPress={() => navigation.navigate('Reminders', { status: 'overdue' })} />
          </>
        ) : null}
        {data?.openTasks ? (
          <StatCard label="My tasks" value={data.openTasks.meta?.total ?? 0} accent={colors.success} onPress={() => navigation.navigate('Tasks')} />
        ) : null}
        {data?.overdueTasks ? (
          <StatCard
            label="Overdue tasks"
            value={data.overdueTasks.meta?.total ?? 0}
            accent={colors.danger}
            onPress={() => navigation.navigate('Tasks', { overdue: true })}
          />
        ) : null}
      </StatGrid>

      <SectionTitle>Shortcuts</SectionTitle>
      <View style={s.shortcuts}>
        {[
          { icon: '🛍️', label: 'LizyMart', to: 'Lizymart' },
          { icon: '👥', label: 'Customers', to: 'Customers' },
          { icon: '⏰', label: 'Reminders', to: 'Reminders' },
          { icon: '🎫', label: 'Tickets', to: 'Tickets' },
          { icon: '💵', label: 'My Fund', to: 'Fund' },
          { icon: '➕', label: 'New Lead', to: 'LeadForm' },
        ].map(item => (
          <Pressable key={item.to} style={({ pressed }) => [s.shortcut, pressed && { opacity: 0.7 }]} onPress={() => navigation.navigate(item.to)}>
            <Text style={s.shortcutIcon}>{item.icon}</Text>
            <Text style={s.shortcutLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  bell: { marginRight: space.lg, padding: 4 },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  shortcut: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: space.lg,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  shortcutIcon: { fontSize: 24 },
  shortcutLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 6 },
});
