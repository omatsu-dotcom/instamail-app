import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { sendMail } from '../services/api';
import { useAuth } from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'MailCompose'>;

export default function MailComposeScreen({ route, navigation }: Props) {
  const { replyToUserId, replyToMailId, replyToName } = route.params ?? {};
  const { setLoggedOut } = useAuth();

  const [subject, setSubject] = useState(replyToName ? `Re: ` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    if (!body.trim()) {
      Alert.alert('エラー', '本文を入力してください');
      return;
    }
    if (!replyToUserId) {
      Alert.alert('エラー', '送信先が設定されていません');
      return;
    }

    setSending(true);
    try {
      await sendMail({
        id: replyToUserId,
        subject: subject.trim(),
        body: body.trim(),
        mailid: replyToMailId,
      });
      Alert.alert('送信完了', 'メールを送信しました', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      if (e.message === 'NOTLOGGEDIN') {
        setLoggedOut();
        navigation.replace('Login');
        return;
      }
      const msg: Record<string, string> = {
        LIMITPOINT: 'ポイントが不足しています',
        NOMINUSCONFIRM: 'マイナスポイントの同意が必要です',
        NOEMAIL: 'メールアドレスが未登録です',
        NOAGEVERIFIED: '年齢認証が必要です',
        INTESTLOGIN: 'テストログインでは送信できません',
      };
      Alert.alert('送信失敗', msg[e.message] || e.message || '送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      {replyToName && (
        <View style={styles.replyBadge}>
          <Text style={styles.replyBadgeText}>返信先：{replyToName}</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>タイトル</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="件名を入力"
            placeholderTextColor="#999"
            returnKeyType="next"
            maxLength={100}
          />
        </View>

        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>本文</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="本文を入力"
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{body.length} / 2000</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.sendButtonText}>送信する</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  replyBadge: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#c8dff7',
  },
  replyBadgeText: { fontSize: 13, color: '#007AFF' },
  scroll: { flex: 1, padding: 16 },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  bodyInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 200,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
