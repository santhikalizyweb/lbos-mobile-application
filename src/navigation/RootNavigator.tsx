import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { Loading } from '../components/ui';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/staff/HomeScreen';
import OrdersScreen from '../screens/staff/OrdersScreen';
import OrderDetailScreen from '../screens/staff/OrderDetailScreen';
import LeadsScreen from '../screens/staff/LeadsScreen';
import LeadDetailScreen from '../screens/staff/LeadDetailScreen';
import LeadFormScreen from '../screens/staff/LeadFormScreen';
import TasksScreen from '../screens/staff/TasksScreen';
import TaskDetailScreen from '../screens/staff/TaskDetailScreen';
import MoreScreen from '../screens/staff/MoreScreen';
import RemindersScreen from '../screens/staff/RemindersScreen';
import CustomersScreen from '../screens/staff/CustomersScreen';
import TicketsScreen from '../screens/staff/TicketsScreen';
import FundScreen from '../screens/staff/FundScreen';
import NotificationsScreen from '../screens/staff/NotificationsScreen';
import LizymartScreen from '../screens/staff/LizymartScreen';
import LizymartDetailScreen from '../screens/staff/LizymartDetailScreen';
import PartnershipOverviewScreen from '../screens/staff/PartnershipOverviewScreen';
import WebsiteScreen from '../screens/staff/WebsiteScreen';
import ProfileScreen from '../screens/staff/ProfileScreen';
import PartnerDashboardScreen from '../screens/partner/PartnerDashboardScreen';
import PartnerEarningsScreen from '../screens/partner/PartnerEarningsScreen';
import PartnerNotificationsScreen from '../screens/partner/PartnerNotificationsScreen';
import PartnerProfileScreen from '../screens/partner/PartnerProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.border },
};

const header = {
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
};

function icon(glyph: string) {
  const TabIcon = ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{glyph}</Text>;
  return TabIcon;
}

const tabOptions = {
  ...header,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
};

function StaffTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: icon('📦') }} />
      <Tab.Screen name="Leads" component={LeadsScreen} options={{ tabBarIcon: icon('🎯') }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: icon('✅') }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarIcon: icon('☰') }} />
    </Tab.Navigator>
  );
}

function PartnerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="PartnerHome" component={PartnerDashboardScreen} options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: icon('🏠') }} />
      <Tab.Screen name="Earnings" component={PartnerEarningsScreen} options={{ tabBarIcon: icon('💰') }} />
      <Tab.Screen name="Alerts" component={PartnerNotificationsScreen} options={{ title: 'Notifications', tabBarLabel: 'Alerts', tabBarIcon: icon('🔔') }} />
      <Tab.Screen name="PartnerProfile" component={PartnerProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, session } = useAuth();

  if (!ready) {
    return <Loading />;
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={header}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : session.accountType === 'partner' ? (
          <Stack.Screen name="PartnerTabs" component={PartnerTabs} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="StaffTabs" component={StaffTabs} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
            <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: 'Lead' }} />
            <Stack.Screen name="LeadForm" component={LeadFormScreen} options={{ title: 'Lead' }} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Customers & Resellers' }} />
            <Stack.Screen name="Tickets" component={TicketsScreen} />
            <Stack.Screen name="Fund" component={FundScreen} options={{ title: 'My Fund' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Lizymart" component={LizymartScreen} options={{ title: 'LizyMart Catalogue' }} />
            <Stack.Screen name="LizymartDetail" component={LizymartDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="Partnership" component={PartnershipOverviewScreen} options={{ title: 'Partnership' }} />
            <Stack.Screen name="Website" component={WebsiteScreen} options={{ title: 'Website Admin' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
