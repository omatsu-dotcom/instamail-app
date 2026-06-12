import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Mail } from '../types';
import { getMail, getMailList, getBaseUrl } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'MailDetail'>;

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr.replace(' ', 'T'));
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function MailDetailScreen({ route, navigation }: Props) {
  const { userId, mailId } = route.params;
  const { setLoggedOut, userInfo } = useAuth();
  const [mail, setMail] = useState<Mail | null>(null);
  const [thread, setThread] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadThread = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const base = await getBaseUrl();
      if (base) setBaseUrl(base);
      const mainMail = await getMail(userId, mailId);
      setMail(mainMail);

      const [allMails, sentMails] = await Promise.all([
        getMailList('all', 1).catch(() => [] as Mail[]),
        getMailList('sent', 1).catch(() => [] as Mail[]),
      ]);

      const partnerId = mainMail.is_myself === 'true' ? userId : mainMail.from_user_id;

      const related = [...allMails, ...sentMails].filter(m =>
        m.from_user_id === partnerId || m.is_myself === 'true'
      );

      const unique = Array.from(new Map(related.map(m => [m.id, m])).values());

      const merged = unique.map(m => m.id === mainMail.id ? mainMail : m);
      if (!merged.some(m => m.id === mainMail.id)) merged.push(mainMail);
      merged.sort((a, b) => a.sent_at.localeCompare(b.sent_at));

      setThread(merged);
    } catch (e: any) {
      if (e.message === 'NOTLOGGEDIN') {
        setLoggedOut();
        navigation.replace('Login');
        return;
      }
      if (showLoading) {
        Alert.alert('エラー', 'メールを取得できませんでした');
        navigation.goBack();
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [userId, mailId]);

  useFocusEffect(
    useCallback(() => {
      loadThread(true);
      intervalRef.current = setInterval(() => {
        loadThread(false);
      }, 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [loadThread])
  );

  const handleReply = () => {
    if (!mail) return;
    navigation.navigate('MailCompose', {
      replyToUserId: mail.from_user_id,
      replyToMailId: mail.id,
      replyToName: mail.from_user_name,
    });
  };

  const partnerName = mail?.is_myself === 'true'
    ? thread.find(m => m.is_myself !== 'true')?.from_user_name || '相手'
    : mail?.from_user_name || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{partnerName}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {thread.map((item) => {
            const isMine = item.is_myself === 'true';
            return (
              <View
                key={item.id}
                style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}
              >
                {!isMine && (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.from_user_name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.bubbleWrapper}>
                  {!isMine && (
                    <Text style={styles.bubbleName}>{item.from_user_name}</Text>
                  )}
                  <Pressable
                    style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
                    onPress={() => {
                      const partnerId2 = mail?.from_user_id || userId;
                      Linking.openURL(`${baseUrl}/mail/view?id=${partnerId2}&mailid=${item.id}`);
                    }}
                  >
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.body ? item.body : item.subject + '\n（タップしてWebで開く）'}
                    </Text>
                    {item.has_attached_photo === 'true' && (
                      <Text style={styles.attachTag}>📷 写真あり</Text>
                    )}
                  </Pressable>
                  <Text style={[styles.timeText, isMine && styles.timeTextRight]}>
                    {formatDateTime(item.sent_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {mail && mail.is_myself !== 'true' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
            <Text style={styles.replyButtonText}>返信する</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  headerSpacer: { backgroundColor: '#007AFF', height: 40 },
  header: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { width: 70 },
  backBtnText: { color: '#fff', fontSize: 15 },
  headerTitle: {
    flex: 1, fontSize: 17, fontWeight: '700',
    color: '#fff', textAlign: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: '#f0f0f0' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bubbleWrapper: { maxWidth: '75%' },
  bubbleName: { fontSize: 12, color: '#666', marginBottom: 4, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  bubbleSubject: { fontSize: 12, color: '#888', marginBottom: 4 },
  bubbleSubjectMine: { color: 'rgba(255,255,255,0.7)' },
  bubbleText: { fontSize: 15, color: '#1a1a1a', lineHeight: 22 },
  bubbleTextMine: { color: '#fff' },
  attachTag: { fontSize: 12, color: '#aaa', marginTop: 6 },
  timeText: { fontSize: 11, color: '#999', marginTop: 4, marginLeft: 4 },
  timeTextRight: { textAlign: 'right', marginRight: 4 },
  footer: {
    padding: 16, paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e0e0e0',
  },
  replyButton: {
    backgroundColor: '#007AFF', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  replyButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});