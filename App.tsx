import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from './src/hooks/useAuth';

export default function App() {
  const { user, loading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    const { error } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    setSubmitting(false);

    if (error) {
      Alert.alert('오류', error.message);
    } else if (isSignUp) {
      Alert.alert('성공', '이메일을 확인해주세요.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>환영합니다!</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>로그아웃</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? '회원가입' : '로그인'}</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isSignUp ? '가입하기' : '로그인'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchText}>
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1f2937',
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    color: '#3b82f6',
    fontSize: 14,
  },
});
