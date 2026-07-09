import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, ScrollView
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

const TEAMS = [
  { label: 'Global', value: 'All' },
  { label: 'IND', value: 'India' },
  { label: 'AUS', value: 'Australia' },
  { label: 'ENG', value: 'England' },
  { label: 'PAK', value: 'Pakistan' },
  { label: 'SA', value: 'South Africa' },
  { label: 'NZ', value: 'New Zealand' },
  { label: 'SL', value: 'Sri Lanka' },
  { label: 'WI', value: 'West Indies' },
  { label: 'BAN', value: 'Bangladesh' },
  { label: 'AFG', value: 'Afghanistan' },
  { label: 'ZIM', value: 'Zimbabwe' },
  { label: 'IRE', value: 'Ireland' },
];

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

function getFormatColor(s: Series) {
  if (s.test > 0 && s.odi === 0 && s.t20 === 0) return '#E8B84B';
  if (s.t20 > 0 && s.test === 0) return '#00E676';
  return '#64B5F6';
}

export default function SeriesScreen() {
  const [series, setSeries] = useState<Series[]>([]);
  const [filtered, setFiltered] = useState<Series[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/series`)
      .then((res) => res.json())
      .then((data) => {
        setSeries(data.series || []);
        setFiltered(data.series || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
  if (selectedTeam === 'All') {
    setFiltered(series.filter((s) =>
      !s.name.toLowerCase().includes('women')
    ));
  } else {
    setFiltered(series.filter((s) =>
      s.name.toLowerCase().includes(selectedTeam.toLowerCase()) &&
      !s.name.toLowerCase().includes('women')
    ));
  }
}, [selectedTeam, series]);

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
        <Text style={styles.errorText}>Failed to load series: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Series</Text>
      <Text style={styles.subtitle}>International & Domestic</Text>

      {/* Team Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {TEAMS.map((team) => (
          <TouchableOpacity
            key={team.value}
            style={[
              styles.filterBtn,
              selectedTeam === team.value && styles.filterBtnActive
            ]}
            onPress={() => setSelectedTeam(team.value)}
          >
            <Text style={[
              styles.filterText,
              selectedTeam === team.value && styles.filterTextActive
            ]}>
              {team.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filtered.length} series {selectedTeam !== 'All' ? `· ${selectedTeam}` : '· All Nations'}
      </Text>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏏</Text>
          <Text style={styles.emptyText}>No series found</Text>
          <Text style={styles.emptySubtext}>Try selecting a different team</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '../series/[id]' as any,
                params: { id: item.id, name: item.name }
              })}
            >
              {/* Format tag */}
              <View style={[styles.formatTag, { backgroundColor: getFormatColor(item) + '20' }]}>
                <Text style={[styles.formatTagText, { color: getFormatColor(item) }]}>
                  {getFormats(item)}
                </Text>
              </View>

              <Text style={styles.seriesName}>{item.name}</Text>

              <View style={styles.cardBottom}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>📅</Text>
                  <Text style={styles.dateText}>
                    {formatDate(item.startDate)} → {item.endDate}
                  </Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{item.matches}M</Text>
                </View>
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
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#00E676',
    fontSize: 14,
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterBtn: {
  backgroundColor: '#1E1E1E',
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: '#2A2A2A',
  minWidth: 60,
  alignItems: 'center',
},
  filterBtnActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  filterText: {
  color: '#888888',
  fontSize: 13,
  fontWeight: '600',
  textAlign: 'center',
},
  filterTextActive: {
    color: '#000000',
  },
  resultCount: {
    color: '#555555',
    fontSize: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  formatTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  formatTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  seriesName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 21,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
  },
  dateText: {
    color: '#666666',
    fontSize: 12,
  },
  matchBadge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchBadgeText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#555555',
    fontSize: 13,
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