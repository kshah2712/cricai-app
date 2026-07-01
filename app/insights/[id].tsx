import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_URL = 'https://cricai-backend-production.up.railway.app';

export default function InsightsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [insight, setInsight] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_URL}/insights/${id}`).then((r) => r.json()),
      fetch(`${API_URL}/match-report/${id}`).then((r) => r.json()),
    ])
      .then(([insightData, reportData]) => {
        setInsight(insightData);
        setReport(reportData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Generating AI insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load insights: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.matchTitle}>
        {insight?.teams?.join(' vs ')}
      </Text>
      <Text style={styles.statusText}>{insight?.status}</Text>

      {/* AI Insight Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>⚡ AI Insight</Text>
        <Text style={styles.cardContent}>{insight?.ai_insight}</Text>
      </View>

      {/* Match Report */}
      {report?.match_report && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📋 Match Report</Text>
          <Text style={styles.cardContent}>{report.match_report}</Text>
        </View>
      )}

      {/* Score Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>🏏 Scorecard</Text>
        {insight?.score_breakdown?.map((s: any, i: number) => (
          <View key={i} style={styles.scoreRow}>
            <Text style={styles.inningText}>{s.inning}</Text>
            <Text style={styles.scoreText}>
              {s.r}/{s.w} ({s.o} ov)
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: '#00E676',
    fontSize: 15,
  },
  matchTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusText: {
    color: '#00E676',
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardContent: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inningText: {
    color: '#A0A0A0',
    fontSize: 13,
    flex: 1,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    color: '#A0A0A0',
    fontSize: 13,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});