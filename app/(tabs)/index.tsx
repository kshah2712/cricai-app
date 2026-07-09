import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, FlatList, Image, Linking
} from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = 'https://cricai-backend-production.up.railway.app';

type Match = {
  id: string;
  name: string;
  status: string;
  venue: string;
  teams: string[];
  score: any[];
  matchStarted: boolean;
  matchEnded: boolean;
};

type Article = {
  title: string;
  ai_summary: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage: string;
};

function getMatchState(match: Match) {
  if (match.matchStarted && !match.matchEnded) return 'Live';
  if (!match.matchStarted && !match.matchEnded) return 'Upcoming';
  return 'Recent';
}

function getTeamAbbr(team: string) {
  const map: { [key: string]: string } = {
    'India': 'IND', 'Australia': 'AUS', 'England': 'ENG',
    'Pakistan': 'PAK', 'South Africa': 'SA', 'New Zealand': 'NZ',
    'Sri Lanka': 'SL', 'West Indies': 'WI', 'Bangladesh': 'BAN',
    'Afghanistan': 'AFG', 'Zimbabwe': 'ZIM', 'Ireland': 'IRE',
  };
  for (const key of Object.keys(map)) {
    if (team.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return team.slice(0, 3).toUpperCase();
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const YOUTUBE_CONTENT = [
  {
    id: '1',
    title: 'CricAI Match Analysis',
    description: 'AI-powered cricket insights',
    url: 'http://www.youtube.com/@thecricai-27',
    thumbnail: 'https://img.youtube.com/vi/default/hqdefault.jpg',
  },
];

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<Article[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/matches`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setLoadingMatches(false);
      })
      .catch(() => setLoadingMatches(false));

    fetch(`${API_URL}/news/summary`)
      .then((res) => res.json())
      .then((data) => {
        setNews(data.articles || []);
        setLoadingNews(false);
      })
      .catch(() => setLoadingNews(false));
  }, []);

  const liveMatches = matches.filter((m) => getMatchState(m) === 'Live');
  const upcomingMatches = matches.filter((m) => getMatchState(m) === 'Upcoming');
  const recentMatches = matches.filter((m) => getMatchState(m) === 'Recent');

  const featuredMatches = [
    ...liveMatches,
    ...upcomingMatches,
    ...recentMatches,
  ].slice(0, 10);

  const upcomingPreviews = upcomingMatches.slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>CricAI</Text>
          <Text style={styles.subtitle}>Cricket Intelligence</Text>
        </View>
        <TouchableOpacity
          style={styles.askBtn}
          onPress={() => router.push('/(tabs)/chat' as any)}
        >
          <Text style={styles.askBtnText}>⚡ Ask CricAI</Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: Live & Upcoming Matches (horizontal scroll) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matches</Text>
          {liveMatches.length > 0 && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveCount}>{liveMatches.length} Live</Text>
            </View>
          )}
        </View>

        {loadingMatches ? (
          <ActivityIndicator color="#00E676" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featuredMatches}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => {
              const state = getMatchState(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.matchCard,
                    state === 'Live' && styles.matchCardLive,
                    state === 'Upcoming' && styles.matchCardUpcoming,
                  ]}
                  onPress={() => router.push({
                    pathname: '/insights/[id]',
                    params: { id: item.id }
                  })}
                >
                  {/* State tag */}
                  <View style={styles.matchCardHeader}>
                    {state === 'Live' && (
                      <View style={styles.liveTag}>
                        <View style={styles.liveDotSmall} />
                        <Text style={styles.liveTagText}>LIVE</Text>
                      </View>
                    )}
                    {state === 'Upcoming' && (
                      <View style={styles.upcomingTag}>
                        <Text style={styles.upcomingTagText}>UPCOMING</Text>
                      </View>
                    )}
                    {state === 'Recent' && (
                      <View style={styles.recentTag}>
                        <Text style={styles.recentTagText}>RESULT</Text>
                      </View>
                    )}
                  </View>

                  {/* Teams */}
                  {item.teams.map((team, i) => {
                    const scoreForTeam = item.score?.find((s: any) =>
                      s.inning?.toLowerCase().includes(
                        team.toLowerCase().split(' ')[0]
                      )
                    );
                    return (
                      <View key={i} style={styles.teamRow}>
                        <Text style={styles.teamAbbr}>{getTeamAbbr(team)}</Text>
                        {scoreForTeam ? (
                          <Text style={styles.teamScore}>
                            {scoreForTeam.r}/{scoreForTeam.w} ({scoreForTeam.o})
                          </Text>
                        ) : (
                          <Text style={styles.teamScoreEmpty}>— —</Text>
                        )}
                      </View>
                    );
                  })}

                  {/* Status */}
                  <Text style={styles.matchStatus} numberOfLines={2}>
                    {item.status}
                  </Text>

                  {/* Venue */}
                  <Text style={styles.matchVenue} numberOfLines={1}>
                    {item.venue?.split(',')[0]}
                  </Text>

                  <Text style={styles.aiHint}>⚡ AI Insights</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Section 2: AI Match Previews */}
      {upcomingPreviews.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Match Previews</Text>
            <Text style={styles.sectionSubtitle}>What to watch for</Text>
          </View>
          {upcomingPreviews.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.previewCard}
              onPress={() => router.push({
                pathname: '/insights/[id]',
                params: { id: match.id }
              })}
            >
              <View style={styles.previewHeader}>
                <Text style={styles.previewTeams}>
                  {match.teams.map(getTeamAbbr).join(' vs ')}
                </Text>
                <View style={styles.upcomingTag}>
                  <Text style={styles.upcomingTagText}>UPCOMING</Text>
                </View>
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {match.name}
              </Text>
              <Text style={styles.previewVenue} numberOfLines={1}>
                📍 {match.venue?.split(',')[0]}
              </Text>
              <View style={styles.previewAiBox}>
                <Text style={styles.previewAiLabel}>⚡ CricAI Preview</Text>
                <Text style={styles.previewAiText}>
                  Tap to see AI tactical preview, toss prediction and win probability
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Section 3: Latest News */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <Text style={styles.sectionSubtitle}>AI Summarized</Text>
        </View>
        {loadingNews ? (
          <ActivityIndicator color="#00E676" style={{ marginVertical: 20 }} />
        ) : (
          news.slice(0, 5).map((article, i) => (
            <TouchableOpacity
              key={i}
              style={styles.newsCard}
              onPress={() => Linking.openURL(article.url)}
            >
              <View style={styles.newsContent}>
                <View style={styles.newsText}>
                  <Text style={styles.newsSource}>{article.source}</Text>
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  {article.ai_summary && (
                    <Text style={styles.newsSummary} numberOfLines={2}>
                      {article.ai_summary}
                    </Text>
                  )}
                  <Text style={styles.newsTime}>{timeAgo(article.publishedAt)}</Text>
                </View>
                {article.urlToImage && (
                  <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Section 4: CricAI Videos / Press Conference */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CricAI Videos</Text>
          <TouchableOpacity onPress={() => Linking.openURL('http://www.youtube.com/@thecricai-27')}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.videoCard}
          onPress={() => Linking.openURL('http://www.youtube.com/@thecricai-27')}
        >
          <View style={styles.videoThumb}>
            <Text style={styles.videoPlay}>▶</Text>
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>CricAI YouTube Channel</Text>
            <Text style={styles.videoDesc}>
              AI-powered match analysis, predictions and data insights
            </Text>
            <Text style={styles.videoSource}>@thecricai-27</Text>
          </View>
        </TouchableOpacity>

        {/* Press Conference placeholder */}
        <View style={styles.pressConfCard}>
          <Text style={styles.pressConfTitle}>🎙️ Press Conferences</Text>
          <Text style={styles.pressConfDesc}>
            Official pre/post match press conferences coming soon — powered by BCCI & ICC YouTube
          </Text>
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#00E676',
    fontSize: 12,
  },
  askBtn: {
    backgroundColor: '#00E676',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  askBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#00E676',
    fontSize: 12,
  },
  seeAll: {
    color: '#00E676',
    fontSize: 13,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  liveCount: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    width: 200,
    borderWidth: 1,
    borderColor: '#242424',
  },
  matchCardLive: {
    borderColor: '#FF444440',
  },
  matchCardUpcoming: {
    borderColor: '#00E67640',
  },
  matchCardHeader: {
    marginBottom: 10,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF444418',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FF4444',
  },
  liveTagText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  upcomingTag: {
    backgroundColor: '#00E67618',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  upcomingTagText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
  },
  recentTag: {
    backgroundColor: '#66666618',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  recentTagText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamAbbr: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  teamScore: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  teamScoreEmpty: {
    color: '#444444',
    fontSize: 13,
  },
  matchStatus: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 4,
  },
  matchVenue: {
    color: '#444444',
    fontSize: 10,
    marginBottom: 8,
  },
  aiHint: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '600',
    borderTopWidth: 1,
    borderTopColor: '#242424',
    paddingTop: 8,
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00E67630',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTeams: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  previewName: {
    color: '#666666',
    fontSize: 11,
    marginBottom: 4,
  },
  previewVenue: {
    color: '#555555',
    fontSize: 11,
    marginBottom: 10,
  },
  previewAiBox: {
    backgroundColor: '#00E67610',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#00E676',
  },
  previewAiLabel: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  previewAiText: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 17,
  },
  newsCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242424',
  },
  newsContent: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  newsText: {
    flex: 1,
  },
  newsSource: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsSummary: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  newsTime: {
    color: '#444444',
    fontSize: 11,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
  },
  videoThumb: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#FF000020',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF000040',
  },
  videoPlay: {
    color: '#FF0000',
    fontSize: 24,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoDesc: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  videoSource: {
    color: '#00E676',
    fontSize: 11,
  },
  pressConfCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#242424',
    borderStyle: 'dashed',
  },
  pressConfTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  pressConfDesc: {
    color: '#555555',
    fontSize: 12,
    lineHeight: 18,
  },
});