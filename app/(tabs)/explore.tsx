import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';

const CONTENT_LINKS = [
  {
    id: '1',
    category: 'YouTube',
    title: 'CricAI YouTube Channel',
    description: 'AI-powered cricket analysis, predictions and data insights',
    url:'http://www.youtube.com/@thecricai-27',
    icon: '▶️',
    color: '#FF0000',
  },
  {
    id: '2',
    category: 'Instagram',
    title: 'CricAI Instagram',
    description: 'Daily cricket insights, stats and match previews',
    url: 'https://instagram.com/thecricai.in',
    icon: '📸',
    color: '#E1306C',
  },
  {
    id: '3',
    category: 'Podcast',
    title: 'CricAI Podcast',
    description: 'Deep dives into cricket analytics and AI in sports',
    url: 'http://www.youtube.com/@thecricai-27',
    icon: '🎙️',
    color: '#00E676',
  },
];

const COMING_SOON = [
  { icon: '🔮', title: 'CricAI Predict', description: 'Make live match predictions and earn points' },
  { icon: '👤', title: 'Player Intelligence', description: 'Deep AI analysis of every player' },
  { icon: '📰', title: 'AI News Feed', description: 'Cricket news summarized by AI' },
  { icon: '🏆', title: 'Fantasy AI', description: 'AI-powered Dream11 recommendations' },
  { icon: '🎬', title: 'Live Shows', description: 'Pre & post match analysis shows' },
];

export default function MoreScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.log('Could not open URL:', url);
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>CricAI Universe</Text>

      {/* Content Links */}
      <Text style={styles.sectionTitle}>OUR CONTENT</Text>
      {CONTENT_LINKS.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => openLink(item.url)}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardCategory} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}

      {/* Coming Soon */}
      <Text style={styles.sectionTitle}>COMING SOON</Text>
      {COMING_SOON.map((item, i) => (
        <View key={i} style={styles.comingSoonCard}>
          <Text style={styles.comingSoonIcon}>{item.icon}</Text>
          <View style={styles.cardText}>
            <Text style={styles.comingSoonTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Soon</Text>
          </View>
        </View>
      ))}

      {/* About */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>CricAI</Text>
        <Text style={styles.aboutText}>
          The world's first AI-powered cricket intelligence platform.
          Beyond scores — we explain WHY matches are won and predict
          WHAT happens next.
        </Text>
        <Text style={styles.version}>Version 1.0.0 Beta</Text>
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
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#00E676',
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardCategory: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  arrow: {
    color: '#00E676',
    fontSize: 18,
    marginLeft: 8,
  },
  comingSoonCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  comingSoonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  comingSoonTitle: {
    color: '#808080',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  badge: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  badgeText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  aboutTitle: {
    color: '#00E676',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aboutText: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  version: {
    color: '#555555',
    fontSize: 11,
  },
});