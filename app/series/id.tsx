import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_URL = 'https://cricai-backend-production.up.railway.app';

type Match = {
  id: string;
  name: string;
  date: string;
  teams: string[];
  venue: string;
  status: string;
  matchType: string;
};

function formatDate(dateStr: string) {
  if (!dateStr) return 'TBD';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function SeriesDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [seriesName, setSeriesName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/series/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setSeriesName(data.name || String(name) || '');
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
        <Text style={styles.loadingText}>Loading series...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{seriesName}</Text>
      <Text style={styles.subtitle}>{matches.length} matches</Text>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No match schedule available yet</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.id && router.push({
                pathname: '/insights/[id]',
                params: { id: item.id }
              })}
            >
              <View style={styles.matchTypeTag}>
                <Text style={styles.matchTypeText}>
                  {item.matchType?.toUpperCase() || 'MATCH'}
                </Text>
              </View>
              <Text style={styles.matchName}>{item.name}</Text>
              {item.venue && (
                <Text style={styles.venue}>📍 {item.venue}</Text>
              )}
              <View style={styles.bottomRow}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                {item.status && (
                  <Text style={styles.status} numberOfLines={1}>
                    {item.status}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
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
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#00E676',
    fontSize: 13,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  matchTypeTag: {
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  matchTypeText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  matchName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  venue: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#555555',
    fontSize: 12,
  },
  status: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#555555',
    fontSize: 14,
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