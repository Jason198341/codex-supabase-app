import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getAIVerdict } from '../services/aiJudge';

const CATEGORIES = ['연애', '직장', '가족', '돈', '기타'];

interface CreateCaseScreenProps {
  navigation: any;
}

export default function CreateCaseScreen({ navigation }: CreateCaseScreenProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '사건을 등록하려면 로그인이 필요합니다.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('입력 오류', '사건 내용을 입력해주세요.');
      return;
    }

    if (!category) {
      Alert.alert('입력 오류', '카테고리를 선택해주세요.');
      return;
    }

    if (content.length < 20) {
      Alert.alert('입력 오류', '사건 내용을 20자 이상 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setAiProcessing(true);

    try {
      // AI 판결 받기
      const aiResult = await getAIVerdict(title, content, category);

      setAiProcessing(false);

      // Supabase에 저장
      const { data, error } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category,
          ai_verdict: aiResult.verdict,
          ai_analysis: aiResult.analysis,
          ai_ratio: aiResult.ratio,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert(
        '🎉 사건 등록 완료!',
        `AI 판결: ${aiResult.verdict === 'guilty' ? '⚖️ 유죄' : aiResult.verdict === 'not_guilty' ? '✅ 무죄' : '🤔 애매'}\n\n${aiResult.ratio}`,
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('CaseDetail', { caseId: data.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('오류', error.message || '사건 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 취소</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>사건 등록</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Category Selection */}
          <Text style={styles.label}>카테고리 *</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="ex) 여친이 깻잎 떼어줬는데 바람인가요?"
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>

          {/* Content */}
          <Text style={styles.label}>사건 내용 *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="억울한 상황을 자세히 설명해주세요. 상황, 배경, 상대방의 행동, 본인의 행동 등을 구체적으로 작성할수록 정확한 판결이 나옵니다."
            placeholderTextColor="#6b7280"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 판결 팁</Text>
            <Text style={styles.infoText}>
              • 감정적 표현보다 사실 위주로 작성하세요{'\n'}
              • 양쪽 입장을 모두 설명하면 더 공정한 판결이 나옵니다{'\n'}
              • 개인정보는 익명으로 처리해주세요
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>
                  {aiProcessing ? '🤖 AI 판결 중...' : '등록 중...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>⚖️ 판결 요청하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#262640',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
  },
  categoryChipText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 200,
  },
  charCount: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#4f46e5',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
