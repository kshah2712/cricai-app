import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = 'https://cricai-backend-production.up.railway.app';

type Series = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  odi: number;
  t20: number;
  test: number;
  matches: number;
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getFormats(s: Series) {
  const formats = [];
  if (s.test > 0) formats.push(`${s.test} Test`);
  if (s.odi > 0) formats.push(`${s.odi} ODI`);
  if (s.t20 > 0) formats.push(`${s.t20} T20`);
  return formats.join(' · ');
}

export default function SeriesScreen() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/series`)
      .then((res) => res.json())
      .then((data) => {
        setSeries(data.series || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load series: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Series</Text>
      <Text style={styles.subtitle}>International & Domestic</Text>
      <FlatList
        data={series}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
              pathname: '../series/[id]' as any,
              params: { id: item.id, name: item.name }
            })}
          >
            <Text style={styles.seriesName}>{item.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.formats}>{getFormats(item)}</Text>
              <Text style={styles.matchCount}>{item.matches} matches</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {formatDate(item.startDate)} → {item.endDate}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#00E676',
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  seriesName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  formats: {
    color: '#00E676',
    fontSize: 12,
    fontWeight: '600',
  },
  matchCount: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  dateRow: {
    marginTop: 4,
  },
  dateText: {
    color: '#555555',
    fontSize: 11,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});