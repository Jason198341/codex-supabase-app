import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Case } from '../types/database';
import { getVerdictEmoji, getVerdictColor } from '../services/aiJudge';

const CATEGORIES = ['전체', '연애', '직장', '가족', '돈', '기타'];

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const fetchCases = useCallback(async () => {
    let query = supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedCategory !== '전체') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setCases(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const renderCaseItem = ({ item }: { item: Case }) => {
    const totalVotes = item.guilty_count + item.not_guilty_count;
    const guiltyPercent = totalVotes > 0 ? Math.round((item.guilty_count / totalVotes) * 100) : 50;

    return (
      <TouchableOpacity
        style={styles.caseCard}
        onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.is_hot && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotText}>🔥 HOT</Text>
            </View>
          )}
        </View>

        <Text style={styles.caseTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.caseContent} numberOfLines={2}>
          {item.content}
        </Text>

        {item.ai_verdict && (
          <View style={styles.verdictContainer}>
            <Text style={[styles.verdictText, { color: getVerdictColor(item.ai_verdict) }]}>
              {getVerdictEmoji(item.ai_verdict)}
            </Text>
            <Text style={styles.ratioText}>{item.ai_ratio}</Text>
          </View>
        )}

        <View style={styles.voteBar}>
          <View style={[styles.guiltyBar, { flex: guiltyPercent }]} />
          <View style={[styles.notGuiltyBar, { flex: 100 - guiltyPercent }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.voteCount}>
            ⚖️ 유죄 {item.guilty_count} vs 무죄 {item.not_guilty_count}
          </Text>
          <Text style={styles.viewCount}>👁 {item.view_count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>사건 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>⚖️ 판사님</Text>
        <Text style={styles.subtitle}>대국민 시시비비 판결소</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Case List */}
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
        renderItem={renderCaseItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 등록된 사건이 없습니다</Text>
            <Text style={styles.emptySubtext}>첫 번째 판결을 요청해보세요!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCase')}
      >
        <Text style={styles.fabText}>✍️</Text>
      </TouchableOpacity>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    연애: '#ec4899',
    직장: '#3b82f6',
    가족: '#22c55e',
    돈: '#f59e0b',
    기타: '#8b5cf6',
  };
  return colors[category] || '#6b7280';
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
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  categoryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a2e',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#262640',
    marginRight: 8,
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
  listContainer: {
    padding: 16,
  },
  caseCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  hotBadge: {
    marginLeft: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  caseContent: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  verdictContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratioText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  voteBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  guiltyBar: {
    backgroundColor: '#ef4444',
  },
  notGuiltyBar: {
    backgroundColor: '#22c55e',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voteCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
  },
});
