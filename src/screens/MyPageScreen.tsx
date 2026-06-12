import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Linking, SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getBaseUrl } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

export default function MyPageScreen({ navigation }: Props) {
  const { userInfo, logout } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleOpenWeb = async () => {
    const base = await getBaseUrl();
    if (base) {
      Linking.openURL(base);
    }
  };

  if (!userInfo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerSpacer} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>マイページ</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  const rows = [
    { label: 'ログインID', value: userInfo.login_id },
    { label: 'ニックネーム', value: userInfo.name },

    { label: 'ポイント', value: `${userInfo.current_point} pt` },

  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>マイページ</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* アバター */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInfo.name.charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userId}>ID: {userInfo.id}</Text>
        </View>

        {/* 情報カード */}
        <View style={styles.card}>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Webへログイン */}
        <TouchableOpacity style={styles.webButton} onPress={handleOpenWeb}>
          <Text style={styles.webButtonText}>🌐　Webサイトを開く</Text>
        </TouchableOpacity>

        {/* ログアウト */}
        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.disabled]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#FF3B30" />
            : <Text style={styles.logoutText}>ログアウト</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  headerSpacer: {
    backgroundColor: '#007AFF',
    height: 40,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  userId: { fontSize: 14, color: '#999' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 15, color: '#666' },
  rowValue: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  webButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  webButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
    minHeight: 52,
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  logoutText: { color: '#FF3B30', fontSize: 17, fontWeight: '600' },
});