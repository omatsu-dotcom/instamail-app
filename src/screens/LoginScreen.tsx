import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const SAVED_ID_KEY = 'saved_login_id';
const SAVED_PW_KEY = 'saved_password';

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 保存済みID/PASSを読み込む
    AsyncStorage.getItem(SAVED_ID_KEY).then(id => { if (id) setLoginId(id); });
    AsyncStorage.getItem(SAVED_PW_KEY).then(pw => { if (pw) setPassword(pw); });
  }, []);

  const handleLogin = async () => {
    if (!loginId.trim() || !password) {
      Alert.alert('エラー', 'IDとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      const result = await login(loginId.trim(), password);
      if (result === 'ok') {
        // 成功したら保存
        await AsyncStorage.setItem(SAVED_ID_KEY, loginId.trim());
        await AsyncStorage.setItem(SAVED_PW_KEY, password);
        navigation.replace('MainTabs');
      } else if (result === 'lock') {
        Alert.alert('ログイン制限', 'ログイン試行回数の上限に達しました。しばらく時間をおいてください。');
      } else {
        Alert.alert('ログイン失敗', 'IDまたはパスワードが正しくありません');
      }
    } catch (e: any) {
      Alert.alert('エラー詳細', e.message || JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>ログイン</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.replace('Setup')}
        >
          <Text style={styles.backButtonText}>← URL設定に戻る</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={loginId}
          onChangeText={setLoginId}
          placeholder="ログインID"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="パスワード"
          placeholderTextColor="#999"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>ログイン</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  backButton: { marginBottom: 24 },
  backButtonText: { fontSize: 14, color: '#007AFF' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    height: 52,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});