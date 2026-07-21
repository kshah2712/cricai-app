import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = 'https://cricai-backend-1nud.onrender.com';

type Article = {
  title: string;
  ai_summary: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage: string;
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/news/summary`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
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
        <Text style={styles.loadingText}>Loading AI news summaries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load news: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CricAI News</Text>
      <Text style={styles.subtitle}>AI-summarized cricket news</Text>
      <FlatList
        data={articles}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL(item.url)}
          >
            {item.urlToImage ? (
              <Image
                source={{ uri: item.urlToImage }}
                style={styles.articleImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.cardContent}>
              <View style={styles.metaRow}>
                <Text style={styles.source}>{item.source}</Text>
                <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.ai_summary && (
                <View style={styles.aiSummaryBox}>
                  <Text style={styles.aiLabel}>⚡ AI Summary</Text>
                  <Text style={styles.aiSummary}>{item.ai_summary}</Text>
                </View>
              )}
              <Text style={styles.readMore}>Read full article →</Text>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  source: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  time: {
    color: '#555555',
    fontSize: 11,
  },
  articleTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 10,
  },
  aiSummaryBox: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#00E676',
  },
  aiLabel: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  aiSummary: {
    color: '#C0C0C0',
    fontSize: 13,
    lineHeight: 19,
  },
  readMore: {
    color: '#555555',
    fontSize: 12,
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