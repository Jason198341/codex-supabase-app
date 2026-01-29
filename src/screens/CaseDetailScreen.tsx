import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Case, Comment } from '../types/database';
import { getVerdictEmoji, getVerdictColor } from '../services/aiJudge';

interface CaseDetailScreenProps {
  route: any;
  navigation: any;
}

export default function CaseDetailScreen({ route, navigation }: CaseDetailScreenProps) {
  const { caseId } = route.params;
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchCase = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (!error && data) {
      setCaseData(data);
      // 조회수 증가
      supabase.from('cases').update({ view_count: data.view_count + 1 }).eq('id', caseId);
    }
  }, [caseId]);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data);
    }
  }, [caseId]);

  const fetchUserVote = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('votes')
      .select('vote')
      .eq('case_id', caseId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserVote(data.vote);
    }
  }, [caseId, user]);

  useEffect(() => {
    Promise.all([fetchCase(), fetchComments(), fetchUserVote()]).then(() => {
      setLoading(false);
    });
  }, [fetchCase, fetchComments, fetchUserVote]);

  const handleVote = async (vote: 'guilty' | 'not_guilty') => {
    if (!user) {
      Alert.alert('로그인 필요', '투표하려면 로그인이 필요합니다.');
      return;
    }

    if (userVote) {
      Alert.alert('이미 투표함', '한 사건에 한 번만 투표할 수 있습니다.');
      return;
    }

    setVoting(true);

    const { error } = await supabase.from('votes').insert({
      case_id: caseId,
      user_id: user.id,
      vote,
    });

    if (error) {
      Alert.alert('오류', '투표에 실패했습니다.');
    } else {
      setUserVote(vote);
      fetchCase(); // 새로고침
      Alert.alert('투표 완료!', vote === 'guilty' ? '⚖️ 유죄에 투표했습니다.' : '✅ 무죄에 투표했습니다.');
    }

    setVoting(false);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('로그인 필요', '댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) return;

    setSubmittingComment(true);

    const { error } = await supabase.from('comments').insert({
      case_id: caseId,
      user_id: user.id,
      content: newComment.trim(),
      side: userVote,
    });

    if (!error) {
      setNewComment('');
      fetchComments();
    }

    setSubmittingComment(false);
  };

  if (loading || !caseData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const totalVotes = caseData.guilty_count + caseData.not_guilty_count;
  const guiltyPercent = totalVotes > 0 ? Math.round((caseData.guilty_count / totalVotes) * 100) : 50;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>
        </View>

        {/* Case Info */}
        <View style={styles.caseContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{caseData.category}</Text>
          </View>

          <Text style={styles.title}>{caseData.title}</Text>
          <Text style={styles.content}>{caseData.content}</Text>

          {/* AI Verdict */}
          {caseData.ai_verdict && (
            <View style={styles.verdictBox}>
              <Text style={styles.verdictTitle}>🤖 AI 판결</Text>
              <Text style={[styles.verdictResult, { color: getVerdictColor(caseData.ai_verdict) }]}>
                {getVerdictEmoji(caseData.ai_verdict)} ({caseData.ai_ratio})
              </Text>
              <Text style={styles.verdictAnalysis}>{caseData.ai_analysis}</Text>
            </View>
          )}

          {/* Vote Section */}
          <View style={styles.voteSection}>
            <Text style={styles.voteTitle}>🗳️ 배심원 투표</Text>

            <View style={styles.voteBar}>
              <View style={[styles.guiltyBar, { flex: guiltyPercent }]} />
              <View style={[styles.notGuiltyBar, { flex: 100 - guiltyPercent }]} />
            </View>

            <View style={styles.voteStats}>
              <Text style={styles.guiltyCount}>⚖️ 유죄 {caseData.guilty_count}표 ({guiltyPercent}%)</Text>
              <Text style={styles.notGuiltyCount}>✅ 무죄 {caseData.not_guilty_count}표 ({100 - guiltyPercent}%)</Text>
            </View>

            {!userVote ? (
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  style={[styles.voteButton, styles.guiltyButton]}
                  onPress={() => handleVote('guilty')}
                  disabled={voting}
                >
                  <Text style={styles.voteButtonText}>⚖️ 유죄</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voteButton, styles.notGuiltyButton]}
                  onPress={() => handleVote('not_guilty')}
                  disabled={voting}
                >
                  <Text style={styles.voteButtonText}>✅ 무죄</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.votedContainer}>
                <Text style={styles.votedText}>
                  {userVote === 'guilty' ? '⚖️ 유죄' : '✅ 무죄'}에 투표하셨습니다
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>💬 배심원 의견 ({comments.length})</Text>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>익명 배심원</Text>
                {comment.side && (
                  <View
                    style={[
                      styles.commentSideBadge,
                      { backgroundColor: comment.side === 'guilty' ? '#ef4444' : '#22c55e' },
                    ]}
                  >
                    <Text style={styles.commentSideText}>
                      {comment.side === 'guilty' ? '유죄' : '무죄'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="의견을 남겨주세요..."
          placeholderTextColor="#6b7280"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={styles.commentSubmitButton}
          onPress={handleSubmitComment}
          disabled={submittingComment || !newComment.trim()}
        >
          <Text style={styles.commentSubmitText}>등록</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  caseContainer: {
    padding: 20,
  },
  categoryBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 26,
    marginBottom: 24,
  },
  verdictBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  verdictTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  verdictResult: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  verdictAnalysis: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 22,
  },
  voteSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
  },
  voteTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  voteBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  guiltyBar: {
    backgroundColor: '#ef4444',
  },
  notGuiltyBar: {
    backgroundColor: '#22c55e',
  },
  voteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  guiltyCount: {
    color: '#ef4444',
    fontSize: 14,
  },
  notGuiltyCount: {
    color: '#22c55e',
    fontSize: 14,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  guiltyButton: {
    backgroundColor: '#ef4444',
  },
  notGuiltyButton: {
    backgroundColor: '#22c55e',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  votedContainer: {
    backgroundColor: '#262640',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  votedText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#9ca3af',
    fontSize: 12,
  },
  commentSideBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  commentSideText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  commentContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#262640',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#262640',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  commentSubmitButton: {
    marginLeft: 12,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: '600',
  },
});
