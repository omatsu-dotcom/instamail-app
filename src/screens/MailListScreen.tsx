import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Mail, MailListMode } from '../types';
import { getMailList } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const MODES: { key: MailListMode; label: string }[] = [
  { key: 'unread', label: '未読' },
  { key: 'all', label: '受信' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function MailListScreen({ navigation }: Props) {
  const { setLoggedOut } = useAuth();
  const [mode, setMode] = useState<MailListMode>('unread');
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMails = useCallback(async (m: MailListMode, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getMailList(m, 1);
      // 2週間以上前のメールを非表示
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const filtered = data.filter(mail => {
        const mailDate = new Date(mail.sent_at.replace(' ', 'T'));
        return mailDate >= twoWeeksAgo;
      });
      setMails(filtered);
    } catch (e: any) {
      if (e.message === 'NOTLOGGEDIN') {
        setLoggedOut();
        navigation.replace('Login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, setLoggedOut]);

  useFocusEffect(
    useCallback(() => {
      fetchMails(mode);
      intervalRef.current = setInterval(() => {
        fetchMails(mode, true);
      }, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [mode, fetchMails]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMails(mode, true);
  };

  const onModeChange = (m: MailListMode) => {
    setMode(m);
    setMails([]);
  };

  const renderItem = ({ item }: { item: Mail }) => {
    const isUnread = item.open_read === 'false';
    const isMine = item.is_myself === 'true';

    return (
      <TouchableOpacity
        style={styles.mailItem}
        onPress={() =>
          navigation.navigate('MailDetail', {
            userId: item.from_user_id,
            mailId: item.id,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.mailLeft}>
          <View style={[styles.avatar, isMine && styles.avatarMine]}>
            <Text style={styles.avatarText}>
              {isMine ? '自' : item.from_user_name.charAt(0)}
            </Text>
          </View>
          {isUnread && !isMine && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.mailBody}>
          <View style={styles.mailHeader}>
            <Text style={[styles.senderName, isUnread && !isMine && styles.bold]} numberOfLines={1}>
              {isMine ? '自分' : item.from_user_name}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.sent_at)}</Text>
          </View>
          <Text style={[styles.subject, isUnread && !isMine && styles.bold]} numberOfLines={1}>
            {item.subject}
          </Text>
          {item.has_attached_photo === 'true' && (
            <Text style={styles.attachTag}>📷 写真あり</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>メッセージ</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : mails.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>メールはありません</Text>
        </View>
      ) : (
        <FlatList
          data={mails}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <View style={styles.tabs}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.tab, mode === m.key && styles.tabActive]}
            onPress={() => onModeChange(m.key)}
          >
            <Text style={[styles.tabText, mode === m.key && styles.tabTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  headerSpacer: { backgroundColor: '#007AFF', height: 40 },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderTopWidth: 2, borderTopColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#888' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  list: { paddingVertical: 4, backgroundColor: '#f5f5f5' },
  mailItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  mailLeft: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarMine: { backgroundColor: '#34C759' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#fff',
  },
  mailBody: { flex: 1 },
  mailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  senderName: { fontSize: 15, color: '#1a1a1a', flex: 1, marginRight: 8 },
  bold: { fontWeight: '700' },
  dateText: { fontSize: 13, color: '#999' },
  subject: { fontSize: 14, color: '#444', lineHeight: 20 },
  attachTag: { fontSize: 12, color: '#888', marginTop: 4 },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  emptyText: { fontSize: 15, color: '#999' },
});