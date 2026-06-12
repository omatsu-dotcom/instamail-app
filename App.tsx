import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider } from './src/hooks/useAuth';
import { getBaseUrl } from './src/services/api';
import { RootStackParamList } from './src/types';

import SetupScreen from './src/screens/SetupScreen';
import LoginScreen from './src/screens/LoginScreen';
import MailListScreen from './src/screens/MailListScreen';
import MailDetailScreen from './src/screens/MailDetailScreen';
import MailComposeScreen from './src/screens/MailComposeScreen';
import MyPageScreen from './src/screens/MyPageScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// メインタブ（メール一覧 + マイページ）
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#e0e0e0' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="MailListTab"
        component={MailListScreen}
        options={{
          tabBarLabel: 'メッセージ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="message" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageScreen}
        options={{
          tabBarLabel: 'マイページ',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// シンプルなテキストアイコン（react-native-vector-icons未設定時の代替）
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    message: '✉',
    person: '👤',
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* react-native-vector-icons が設定済みならそちらに差し替え可 */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color === '#007AFF' ? '#E8F4FF' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </View>
  );
}

function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Setup' | 'Login' | null>(null);

  useEffect(() => {
    getBaseUrl().then(url => {
      setInitialRoute(url ? 'Login' : 'Setup');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#007AFF',
        headerTitleStyle: { color: '#1a1a1a', fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Setup"
        component={SetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MailDetail"
        component={MailDetailScreen}
        options={{ title: 'メッセージ' }}
      />
      <Stack.Screen
        name="MailCompose"
        component={MailComposeScreen}
        options={{ title: '返信' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
