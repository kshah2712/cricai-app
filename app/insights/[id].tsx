import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_URL = 'https://cricai-backend-production.up.railway.app';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [insight, setInsight] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [prematch, setPrematch] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [motm, setMotm] = useState<any>(null);
  const [matchState, setMatchState] = useState<'pre' | 'live' | 'post'>('pre');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userPrediction, setUserPrediction] = useState<string | null>(null);
  const [predictionLocked, setPredictionLocked] = useState(false);
  const [liveWinProb, setLiveWinProb] = useState<{ team1: number; team2: number } | null>(null);
  const pollingRef = useRef<any>(null);

  const detectMatchState = (insightData: any): 'pre' | 'live' | 'post' => {
    const status = (insightData?.status || '').toLowerCase();
    const scores = insightData?.score_breakdown || [];

    // Post match indicators
    const postKeywords = ['won', 'win', 'lost', 'draw', 'tied', 'abandoned',
      'no result', 'match drawn', 'innings', 'runs', 'wkt', 'wicket'];
    const isPost = postKeywords.some(kw => status.includes(kw));

    if (isPost) return 'post';
    if (scores.length > 0 && !isPost) return 'live';
    return 'pre';
  };

  const fetchMatchData = async () => {
    if (!id) return;
    try {
      const [insightRes, reportRes, prematchRes, scorecardRes, motmRes] = await Promise.all([
        fetch(`${API_URL}/insights/${id}`).then(r => r.json()),
        fetch(`${API_URL}/match-report/${id}`).then(r => r.json()),
        fetch(`${API_URL}/pre-match/${id}`).then(r => r.json()),
        fetch(`${API_URL}/scorecard/${id}`).then(r => r.json()),
        fetch(`${API_URL}/motm/${id}`).then(r => r.json()),
      ]);

      setInsight(insightRes);
      setReport(reportRes);
      setPrematch(prematchRes);
      setScorecard(scorecardRes);
      setMotm(motmRes);

      const state = detectMatchState(insightRes);
      setMatchState(state);

      if (state === 'post') {
        setActiveTab('report');
      } else if (state === 'live') {
        setActiveTab('live');
        const scores = insightRes.score_breakdown;
        if (scores.length >= 2) {
          const t1 = scores[0].r;
          const t2 = scores[1].r;
          const total = t1 + t2;
          if (total > 0) {
            setLiveWinProb({
              team1: Math.round((t1 / total) * 100),
              team2: Math.round((t2 / total) * 100),
            });
          }
        }
      } else {
        setActiveTab('overview');
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();
    pollingRef.current = setInterval(fetchMatchData, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  const getTabs = () => {
    if (matchState === 'pre') return ['overview', 'preview', 'predict'];
    if (matchState === 'live') return ['live', 'scorecard', 'predict', 'insight'];
    return ['report', 'scorecard', 'motm', 'insight', 'predict'];
  };

  const getTabLabel = (tab: string) => ({
    overview: 'Overview',
    preview: 'AI Preview',
    predict: '🏆 Predict',
    live: '🔴 Live',
    insight: '⚡ AI',
    report: '📋 Report',
    scorecard: 'Scorecard',
    motm: 'MOTM',
  }[tab] || tab);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Loading match data...</Text>
      </View>
    );
  }

  if (!insight) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load match</Text>
      </View>
    );
  }

  const innings = scorecard?.scorecard?.scorecard || [];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTeams} numberOfLines={1}>
            {insight.teams?.map((t: string) => t.split(' ')[0]).join(' vs ')}
          </Text>
          <View style={[
            styles.stateBadge,
            matchState === 'live' && styles.stateBadgeLive,
            matchState === 'post' && styles.stateBadgePost,
          ]}>
            {matchState === 'live' && <View style={styles.liveDot} />}
            <Text style={[
              styles.stateBadgeText,
              matchState === 'live' && styles.stateBadgeTextLive,
              matchState === 'post' && styles.stateBadgeTextPost,
            ]}>
              {matchState === 'live' ? 'LIVE' : matchState === 'post' ? 'RESULT' : 'UPCOMING'}
            </Text>
          </View>
        </View>
      </View>

      {/* Score Banner */}
      <View style={styles.scoreBanner}>
        {insight.score_breakdown?.length > 0 ? (
          insight.score_breakdown.map((s: any, i: number) => (
            <View key={i} style={styles.scoreLine}>
              <Text style={styles.scoreInning} numberOfLines={1}>
                {s.inning?.split(',')[0]?.replace('Inning 1', '').trim()}
              </Text>
              <Text style={styles.scoreValue}>{s.r}/{s.w}</Text>
              <Text style={styles.scoreOvers}>({s.o} ov)</Text>
            </View>
          ))
        ) : (
          <Text style={styles.upcomingText}>Match yet to begin</Text>
        )}
        <Text style={styles.statusText} numberOfLines={2}>{insight.status}</Text>

        {/* Live Win Probability */}
        {matchState === 'live' && liveWinProb && (
          <View style={styles.winProbContainer}>
            <View style={styles.winProbBarContainer}>
              <View style={[styles.winProbSegment, styles.winProbGreen,
                { flex: liveWinProb.team1 }]} />
              <View style={[styles.winProbSegment, styles.winProbRed,
                { flex: liveWinProb.team2 }]} />
            </View>
            <View style={styles.winProbLabels}>
              <Text style={styles.winProbTeam}>
                {insight.teams?.[0]?.split(' ')[0]} {liveWinProb.team1}%
              </Text>
              <Text style={styles.winProbCenter}>Win Probability</Text>
              <Text style={styles.winProbTeam}>
                {liveWinProb.team2}% {insight.teams?.[1]?.split(' ')[0]}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
      >
        <View style={styles.tabRow}>
          {getTabs().map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {getTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>📍 Venue</Text>
              <Text style={styles.cardText}>{prematch?.venue || 'Loading...'}</Text>
            </View>
            {prematch?.toss_winner && prematch.toss_winner !== 'Not available yet' && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>🪙 Toss</Text>
                <Text style={styles.cardText}>
                  {prematch.toss_winner} chose to {prematch.toss_choice}
                </Text>
              </View>
            )}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🏏 Teams</Text>
              {insight.teams?.map((t: string, i: number) => (
                <Text key={i} style={styles.cardText}>• {t}</Text>
              ))}
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>📋 Playing XI</Text>
              <Text style={styles.comingSoonText}>Coming Soon — Squad data requires upgraded API</Text>
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🌤️ Pitch & Weather Report</Text>
              <Text style={styles.comingSoonText}>Coming Soon — Weather API integration planned</Text>
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>📊 Head to Head</Text>
              <Text style={styles.comingSoonText}>Coming Soon — Historical data via Cricsheet</Text>
            </View>
          </View>
        )}

        {/* ─── AI PREVIEW TAB ─── */}
        {activeTab === 'preview' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🔮 AI Pre-Match Preview</Text>
              <Text style={styles.cardContent}>{prematch?.ai_preview || 'Generating...'}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>⚡ CricAI Win Prediction</Text>
              <Text style={styles.cardContent}>{insight.ai_insight}</Text>
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>📈 Win Probability Graph</Text>
              <Text style={styles.comingSoonText}>Coming Soon — Visual probability chart pre-match</Text>
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>⚔️ Key Player Battles</Text>
              <Text style={styles.comingSoonText}>Coming Soon — Requires player stats API</Text>
            </View>
          </View>
        )}

        {/* ─── LIVE TAB ─── */}
        {activeTab === 'live' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🔴 Live Score</Text>
              {insight.score_breakdown?.map((s: any, i: number) => (
                <View key={i} style={styles.liveScoreRow}>
                  <Text style={styles.liveInning}>{s.inning}</Text>
                  <Text style={styles.liveScore}>{s.r}/{s.w} ({s.o} ov)</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>📊 Match Status</Text>
              <Text style={styles.cardContent}>{insight.status}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>⚡ AI Live Analysis</Text>
              <Text style={styles.cardContent}>{insight.ai_insight}</Text>
            </View>

            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🏏 Live Batting Scorecard</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Current batter stats, strike rates, partnerships
              </Text>
            </View>

            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🎯 Live Bowling Figures</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Current bowler stats, economy, spell analysis
              </Text>
            </View>

            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>📈 Live Win Probability Graph</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Over-by-over win probability with AI reasoning
              </Text>
            </View>

            <View style={styles.refreshCard}>
              <Text style={styles.refreshText}>🔄 Auto-refreshing every 30 seconds</Text>
            </View>
          </View>
        )}

        {/* ─── SCORECARD TAB ─── */}
        {activeTab === 'scorecard' && (
          <View>
            {innings.length > 0 ? innings.map((inning: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 16 }}>

                {/* Inning Header */}
                <View style={styles.inningHeader}>
                  <Text style={styles.inningTitle}>{inning.inning}</Text>
                  {insight.score_breakdown?.[idx] && (
                    <Text style={styles.inningTotal}>
                      {insight.score_breakdown[idx].r}/{insight.score_breakdown[idx].w}
                      {' '}({insight.score_breakdown[idx].o} ov)
                    </Text>
                  )}
                </View>

                {/* Batting Table */}
                <View style={styles.scorecardTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 3 }]}>BATTER</Text>
                    <Text style={styles.th}>R</Text>
                    <Text style={styles.th}>B</Text>
                    <Text style={styles.th}>4s</Text>
                    <Text style={styles.th}>6s</Text>
                    <Text style={styles.th}>SR</Text>
                  </View>

                  {inning.batting?.map((b: any, i: number) => (
                    <View key={i} style={[
                      styles.tableDataRow,
                      i % 2 === 0 && styles.tableRowAlt
                    ]}>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.playerName}>{b.batsman?.name}</Text>
                        <Text style={styles.dismissal} numberOfLines={1}>
                          {b['dismissal-text']}
                        </Text>
                      </View>
                      <Text style={[styles.td, b.r >= 50 && styles.tdHighlight]}>{b.r}</Text>
                      <Text style={styles.td}>{b.b}</Text>
                      <Text style={styles.td}>{b['4s']}</Text>
                      <Text style={styles.td}>{b['6s']}</Text>
                      <Text style={styles.td}>{Number(b.sr || 0).toFixed(1)}</Text>
                    </View>
                  ))}
                </View>

                {/* Bowling Table */}
                <View style={[styles.scorecardTable, { marginTop: 8 }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 3 }]}>BOWLER</Text>
                    <Text style={styles.th}>O</Text>
                    <Text style={styles.th}>M</Text>
                    <Text style={styles.th}>R</Text>
                    <Text style={styles.th}>W</Text>
                    <Text style={styles.th}>Eco</Text>
                  </View>

                  {inning.bowling?.map((b: any, i: number) => (
                    <View key={i} style={[
                      styles.tableDataRow,
                      i % 2 === 0 && styles.tableRowAlt
                    ]}>
                      <Text style={[styles.playerName, { flex: 3 }]}>{b.bowler?.name}</Text>
                      <Text style={styles.td}>{b.o}</Text>
                      <Text style={styles.td}>{b.m}</Text>
                      <Text style={styles.td}>{b.r}</Text>
                      <Text style={[styles.td, b.w > 0 && styles.wicketHighlight]}>{b.w}</Text>
                      <Text style={styles.td}>{b.eco}</Text>
                    </View>
                  ))}
                </View>

              </View>
            )) : (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>🏏 Scorecard</Text>
                {/* Show basic scorecard from insight data */}
                {insight.score_breakdown?.map((s: any, i: number) => (
                  <View key={i} style={styles.liveScoreRow}>
                    <Text style={styles.liveInning}>{s.inning}</Text>
                    <Text style={styles.liveScore}>{s.r}/{s.w} ({s.o} ov)</Text>
                  </View>
                ))}
                <Text style={[styles.cardContent, { marginTop: 12, color: '#555555' }]}>
                  Detailed ball-by-ball scorecard requires upgraded API plan
                </Text>
              </View>
            )}

            {/* Match info */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>📍 Match Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{prematch?.venue}</Text>
              </View>
              {prematch?.toss_winner && prematch.toss_winner !== 'Not available yet' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Toss</Text>
                  <Text style={styles.infoValue}>
                    {prematch.toss_winner} elected to {prematch.toss_choice}
                  </Text>
                </View>
              )}
              {scorecard?.scorecard?.matchWinner && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Winner</Text>
                  <Text style={[styles.infoValue, { color: '#00E676' }]}>
                    {scorecard.scorecard.matchWinner}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── MOTM TAB ─── */}
        {activeTab === 'motm' && (
          <View>
            {/* Official MOTM */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🏅 Official Man of the Match</Text>
              {motm?.official_motm ? (
                <View style={styles.motmCard}>
                  <Text style={styles.motmName}>{motm.official_motm}</Text>
                  <Text style={styles.motmTeam}>{motm.official_motm_team}</Text>
                </View>
              ) : (
                <Text style={styles.cardContent}>
                  Official MOTM data not available from current API tier.
                  Will be available with paid API upgrade.
                </Text>
              )}
            </View>

            {/* AI Predicted MOTM */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>⚡ CricAI MOTM Pick</Text>
              <View style={styles.motmCard}>
                <Text style={styles.motmName}>{motm?.ai_motm?.predicted_motm}</Text>
                <Text style={styles.motmTeam}>{motm?.ai_motm?.team}</Text>
              </View>
              <Text style={styles.cardContent}>{motm?.ai_motm?.reasoning}</Text>
            </View>

            {/* MOTM Prediction (pre-match) */}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🎯 Predict MOTM Before Match</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Pick your Man of the Match before the game starts.
                Earn 30 points if correct!
              </Text>
            </View>
          </View>
        )}

        {/* ─── AI INSIGHT TAB ─── */}
        {activeTab === 'insight' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>⚡ AI Match Insight</Text>
              <Text style={styles.cardContent}>{insight.ai_insight}</Text>
            </View>
            {matchState === 'post' && report?.match_report && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>📊 Tactical Read</Text>
                <Text style={styles.cardContent}>
                  {report.match_report.split('TACTICAL READ:')[1]?.split('KEY PERFORMERS:')[0]?.trim() ||
                    'See full report in the Report tab'}
                </Text>
              </View>
            )}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>📈 Win Probability Timeline</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Visual graph showing how win probability shifted over-by-over
              </Text>
            </View>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>⚔️ Player Matchup Analysis</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Batter vs bowler type analytics (e.g. Kohli vs left-arm spin)
              </Text>
            </View>
          </View>
        )}

        {/* ─── AI REPORT TAB ─── */}
        {activeTab === 'report' && (
          <View>
            {/* Result summary */}
            <View style={[styles.card, styles.resultCard]}>
              <Text style={styles.resultStatus}>{insight.status}</Text>
              {prematch?.venue && (
                <Text style={styles.resultVenue}>📍 {prematch.venue}</Text>
              )}
            </View>

            {report?.match_report ? (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>📋 AI Match Report</Text>
                <Text style={styles.cardContent}>{report.match_report}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardContent}>
                  {report?.message || 'Match report generating...'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── PREDICT TAB ─── */}
        {activeTab === 'predict' && (
          <View>

            {/* Match Winner Prediction */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>🏆 Match Winner</Text>
              {matchState === 'post' ? (
                <View>
                  <View style={styles.resultBanner}>
                    <Text style={styles.resultBannerText}>{insight.status}</Text>
                  </View>
                  {userPrediction ? (
                    <View style={styles.predictionResultBox}>
                      <Text style={styles.predictionYourPick}>
                        Your pick: {userPrediction}
                      </Text>
                      <Text style={[
                        styles.predictionOutcome,
                        insight.status?.toLowerCase().includes(
                          userPrediction?.split(' ')[0]?.toLowerCase() || ''
                        ) ? styles.correct : styles.wrong
                      ]}>
                        {insight.status?.toLowerCase().includes(
                          userPrediction?.split(' ')[0]?.toLowerCase() || ''
                        ) ? '🎉 Correct! +50 points earned' : '😔 Incorrect — better luck next match!'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noPredictionText}>
                      You didn't make a prediction for this match
                    </Text>
                  )}
                </View>
              ) : !predictionLocked ? (
                <View>
                  <Text style={styles.predictInstruction}>
                    Who wins? Earn 50 points if correct!
                  </Text>
                  {insight.teams?.map((team: string, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.predictTeamBtn,
                        userPrediction === team && styles.predictTeamBtnSelected,
                      ]}
                      onPress={() => setUserPrediction(team)}
                    >
                      <Text style={[
                        styles.predictTeamText,
                        userPrediction === team && styles.predictTeamTextSelected,
                      ]}>
                        {team}
                      </Text>
                      {userPrediction === team && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {userPrediction && (
                    <TouchableOpacity
                      style={styles.lockBtn}
                      onPress={() => setPredictionLocked(true)}
                    >
                      <Text style={styles.lockBtnText}>🔒 Lock My Prediction</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.lockedBox}>
                  <Text style={styles.lockedLabel}>✓ Prediction Locked</Text>
                  <Text style={styles.lockedTeam}>{userPrediction}</Text>
                  {matchState === 'live' && (
                    <Text style={styles.waitingText}>⏳ Match in progress...</Text>
                  )}
                </View>
              )}
            </View>

            {/* Points System Info */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>💰 Points You Can Earn</Text>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsAction}>Predict match winner correctly</Text>
                <Text style={styles.pointsValue}>+50 pts</Text>
              </View>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsAction}>Predict MOTM correctly</Text>
                <Text style={styles.pointsValue}>+30 pts</Text>
              </View>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsAction}>Predict correct Playing XI player</Text>
                <Text style={styles.pointsValue}>+10 pts</Text>
              </View>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsAction}>Beat AI on live over prediction</Text>
                <Text style={styles.pointsValue}>+20 pts</Text>
              </View>
              <View style={styles.pointsRow}>
                <Text style={styles.pointsAction}>5 correct predictions in a row</Text>
                <Text style={styles.pointsValue}>+100 pts</Text>
              </View>
            </View>

            {/* Live Micro-Predictions */}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>⚡ Live Micro-Predictions</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — During live matches, predict next wicket,
                over runs, boundary in next ball and more. Earn points every over!
              </Text>
            </View>

            {/* Beat the AI */}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🤖 Beat the AI</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — CricAI predicts the next over's run tally.
                You challenge it. Beat the AI = +30 bonus points.
                "I beat CricAI!" is a shareable moment.
              </Text>
            </View>

            {/* Playing XI Prediction */}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🏏 Pick Your Playing XI</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — Pick your Playing XI before the match.
                AI picks its own XI. Compare and earn points per correct player!
              </Text>
            </View>

            {/* Fantasy AI */}
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonTitle}>🎯 Fantasy AI Recommendations</Text>
              <Text style={styles.comingSoonText}>
                Coming Soon — CricAI suggests your Dream11 captain,
                vice-captain and differential picks based on pitch, form and matchups.
              </Text>
            </View>

          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: {
    flex: 1, backgroundColor: '#121212',
    justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#1A1A1A', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center',
  },
  backText: { color: '#FFFFFF', fontSize: 18 },
  headerCenter: { flex: 1, gap: 4 },
  headerTeams: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  stateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#2A2A2A', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  stateBadgeLive: { backgroundColor: '#FF444418' },
  stateBadgePost: { backgroundColor: '#00E67618' },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF4444' },
  stateBadgeText: { color: '#888888', fontSize: 10, fontWeight: '700' },
  stateBadgeTextLive: { color: '#FF4444' },
  stateBadgeTextPost: { color: '#00E676' },
  scoreBanner: {
    backgroundColor: '#1A1A1A', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#242424',
  },
  scoreLine: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 4, gap: 8,
  },
  scoreInning: { color: '#888888', fontSize: 13, flex: 1 },
  scoreValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  scoreOvers: { color: '#666666', fontSize: 12 },
  statusText: { color: '#00E676', fontSize: 13, fontWeight: '500', marginTop: 6 },
  upcomingText: { color: '#666666', fontSize: 14, marginBottom: 4 },
  winProbContainer: { marginTop: 12 },
  winProbBarContainer: {
    flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  winProbSegment: { height: '100%' },
  winProbGreen: { backgroundColor: '#00E676' },
  winProbRed: { backgroundColor: '#FF4444' },
  winProbLabels: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  winProbTeam: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  winProbCenter: { color: '#666666', fontSize: 11 },
  tabScroll: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1, borderBottomColor: '#242424',
    maxHeight: 48,
  },
  tabRow: { flexDirection: 'row' },
  tab: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#00E676' },
  tabText: { color: '#555555', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#00E676' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardLabel: {
    color: '#00E676', fontSize: 11, fontWeight: '700',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  cardText: { color: '#CCCCCC', fontSize: 14, lineHeight: 22, marginBottom: 4 },
  cardContent: { color: '#CCCCCC', fontSize: 14, lineHeight: 22 },
  comingSoonCard: {
    backgroundColor: '#161616', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A', borderStyle: 'dashed',
  },
  comingSoonTitle: { color: '#555555', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  comingSoonText: { color: '#3A3A3A', fontSize: 12, lineHeight: 18 },
  liveScoreRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  liveInning: { color: '#A0A0A0', fontSize: 13, flex: 1 },
  liveScore: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  refreshCard: { alignItems: 'center', padding: 12 },
  refreshText: { color: '#444444', fontSize: 12 },
  inningHeader: {
    backgroundColor: '#2A2A2A', borderRadius: 8, padding: 12,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
  },
  inningTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  inningTotal: { color: '#00E676', fontSize: 13, fontWeight: '700' },
  scorecardTable: {
    backgroundColor: '#1E1E1E', borderRadius: 10, overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row', backgroundColor: '#2A2A2A',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  th: {
    color: '#888888', fontSize: 11, fontWeight: '700',
    width: 36, textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  tableRowAlt: { backgroundColor: '#1A1A1A' },
  playerName: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  dismissal: { color: '#555555', fontSize: 11, marginTop: 1 },
  td: {
    color: '#CCCCCC', fontSize: 12, fontWeight: '500',
    width: 36, textAlign: 'center',
  },
  tdHighlight: { color: '#00E676', fontWeight: '700' },
  wicketHighlight: { color: '#00E676', fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', marginBottom: 8, gap: 8,
  },
  infoLabel: { color: '#666666', fontSize: 13, width: 60 },
  infoValue: { color: '#CCCCCC', fontSize: 13, flex: 1 },
  motmCard: {
    backgroundColor: '#2A2A2A', borderRadius: 8,
    padding: 12, marginBottom: 10,
  },
  motmName: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  motmTeam: { color: '#00E676', fontSize: 13, marginTop: 2 },
  resultCard: { borderWidth: 1, borderColor: '#00E67640' },
  resultStatus: { color: '#00E676', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  resultVenue: { color: '#666666', fontSize: 12 },
  resultBanner: {
    backgroundColor: '#00E67615', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  resultBannerText: { color: '#00E676', fontSize: 14, fontWeight: '600' },
  predictionResultBox: { gap: 6 },
  predictionYourPick: { color: '#888888', fontSize: 13 },
  predictionOutcome: { fontSize: 14, fontWeight: '700' },
  correct: { color: '#00E676' },
  wrong: { color: '#FF4444' },
  noPredictionText: { color: '#555555', fontSize: 13 },
  predictInstruction: { color: '#888888', fontSize: 13, marginBottom: 12 },
  predictTeamBtn: {
    backgroundColor: '#2A2A2A', borderRadius: 10, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#333333',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  predictTeamBtnSelected: { backgroundColor: '#00E67620', borderColor: '#00E676' },
  predictTeamText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  predictTeamTextSelected: { color: '#00E676' },
  checkmark: { color: '#00E676', fontSize: 16, fontWeight: '700' },
  lockBtn: {
    backgroundColor: '#00E676', borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  lockBtnText: { color: '#000000', fontSize: 14, fontWeight: '700' },
  lockedBox: {
    backgroundColor: '#00E67610', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#00E67640',
  },
  lockedLabel: { color: '#00E676', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  lockedTeam: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  waitingText: { color: '#888888', fontSize: 13, marginTop: 6 },
  pointsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  pointsAction: { color: '#CCCCCC', fontSize: 13, flex: 1 },
  pointsValue: { color: '#00E676', fontSize: 13, fontWeight: '700' },
  loadingText: { color: '#A0A0A0', fontSize: 13 },
  errorText: { color: '#FF5252', fontSize: 14 },
});