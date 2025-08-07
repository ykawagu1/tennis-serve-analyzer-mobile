import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { Card, Button, Divider } from 'react-native-paper';
import { useSkin } from '../SkinContext';
import { useLanguage } from '../contexts/LanguageContext';

// グラデーション背景
import AnimatedGradientBackground from '../components/AnimatedGradientBackground'; // gradient-blue
import AnimatedRedGradientBackground from '../components/AnimatedRedGradientBackground';
import AnimatedPurpleGradientBackground from '../components/AnimatedPurpleGradientBackground';
import AnimatedSunsetGradientBackground from '../components/AnimatedSunsetGradientBackground';
import AnimatedGreenGradientBackground from '../components/AnimatedGreenGradientBackground';
import AnimatedRainbowGradientBackground from '../components/AnimatedRainbowGradientBackground';
import AnimatedNeonPulseBackground from '../components/AnimatedNeonPulseBackground';
import AnimatedNeonStrobeBackground from '../components/AnimatedNeonStrobeBackground';
import AnimatedAuroraBackground from '../components/AnimatedAuroraBackground';
import AnimatedCandyPopBackground from '../components/AnimatedCandyPopBackground';

// ========== 多言語ラベル定義 ==========
const NEW_ANALYSIS_LABELS = {
  ja: "新しい解析",
  en: "New Analysis",
  de: "Neue Analyse",
  fr: "Nouvelle analyse",
  es: "Nuevo análisis",
  pt: "Nova análise",
};

const SHARE_RESULTS_LABELS = {
  ja: "結果をシェア",
  en: "Share Results",
  de: "Ergebnisse teilen",
  fr: "Partager les résultats",
  es: "Compartir resultados",
  pt: "Compartilhar resultados",
};

const TITLES = {
  score:    { ja: "総合スコア",         en: "Total Score",          de: "Gesamtergebnis",     fr: "Score total",        es: "Puntuación total",     pt: "Pontuação total" },
  phase:    { ja: "フェーズ別スコア",     en: "Phase Scores",         de: "Phasenbewertung",    fr: "Scores par phase",   es: "Puntuación por fase",  pt: "Pontuação por fase" },
  overlay:  { ja: "オーバーレイ画像",     en: "Overlay Images",       de: "Overlay-Bilder",     fr: "Images superposées", es: "Imágenes de superposición", pt: "Imagens de sobreposição" },
  analysis: { ja: "基本解析結果",         en: "Basic Analysis",       de: "Grundanalyse",       fr: "Analyse de base",    es: "Análisis básico",      pt: "Análise básica" },
  advice:   { ja: "基本アドバイス",       en: "Basic Advice",         de: "Grundlegender Rat",  fr: "Conseil de base",    es: "Consejo básico",       pt: "Conselho básico" },
  tech:     { ja: "技術ポイント",         en: "Technical Points",     de: "Technische Punkte",  fr: "Points techniques",  es: "Puntos técnicos",      pt: "Pontos técnicos" },
  practice: { ja: "練習提案",             en: "Practice Suggestions", de: "Übungsvorschläge",   fr: "Suggestions de pratique", es: "Sugerencias de práctica", pt: "Sugestões de prática" },
  ai:       { ja: "AI詳細アドバイス",      en: "Detailed AI Advice",   de: "Detaillierter KI-Rat", fr: "Conseil IA détaillé", es: "Consejo detallado de IA", pt: "Conselho detalhado de IA" },
  onepoint: { ja: "ワンポイントアドバイス", en: "One-point Advice",     de: "Tipp des Tages",     fr: "Conseil clé",        es: "Consejo clave",        pt: "Dica única" },
  program:  { ja: "改善プログラム",        en: "Improvement Program",  de: "Verbesserungsprogramm", fr: "Programme d'amélioration", es: "Programa de mejora", pt: "Programa de melhoria" },
};

const gradientComponents = {
  'gradient-blue': AnimatedGradientBackground,
  'gradient-red': AnimatedRedGradientBackground,
  'gradient-purple': AnimatedPurpleGradientBackground,
  'gradient-sunset': AnimatedSunsetGradientBackground,
  'gradient-green': AnimatedGreenGradientBackground,
  'gradient-rainbow': AnimatedRainbowGradientBackground,
  'gradient-neon': AnimatedNeonPulseBackground,
  'gradient-strobe': AnimatedNeonStrobeBackground,
  'gradient-aurora': AnimatedAuroraBackground,
  'gradient-candy': AnimatedCandyPopBackground,
};

const getSkillLevel = (score, locale) => {
  if (locale === "ja") {
    if (score < 6) return "初級";
    if (score < 8) return "中級";
    return "上級";
  } else if (locale === "de") {
    if (score < 6) return "Anfänger";
    if (score < 8) return "Mittelstufe";
    return "Fortgeschritten";
  } else if (locale === "fr") {
    if (score < 6) return "Débutant";
    if (score < 8) return "Intermédiaire";
    return "Avancé";
  } else if (locale === "es") {
    if (score < 6) return "Principiante";
    if (score < 8) return "Intermedio";
    return "Avanzado";
  } else if (locale === "pt") {
    if (score < 6) return "Iniciante";
    if (score < 8) return "Intermediário";
    return "Avançado";
  }
  if (score < 6) return "Beginner";
  if (score < 8) return "Intermediate level";
  return "Advanced level";
};

const ResultScreen = ({ route, navigation }) => {
  const { analysisResult } = route.params;
  const { skin, skinKey, isPremium } = useSkin();
  const { language } = useLanguage(); // ★ここでグローバル言語取得
  const locale = language || 'en';    // fallbackで'en'

  // Markdown風整形
  const formatAIResponse = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('【') && trimmedLine.endsWith('】')) {
        elements.push(
          <Text key={`h2-${index}`} style={[styles.heading2, { color: skin.primary }]}>
            {trimmedLine}
          </Text>
        );
      } else if (/^\d+\./.test(trimmedLine)) {
        elements.push(
          <View key={`ol-${index}`} style={styles.listItem}>
            <Text style={[styles.numberBullet, { color: skin.accent }]}>{trimmedLine.match(/^\d+\./)[0]}</Text>
            <Text style={styles.listText}>{trimmedLine.replace(/^\d+\.\s*/, '')}</Text>
          </View>
        );
      } else if (trimmedLine.startsWith('- ')) {
        elements.push(
          <View key={`li-${index}`} style={styles.listItem}>
            <Text style={[styles.bullet, { color: skin.primary }]}>•</Text>
            <Text style={styles.listText}>{trimmedLine.replace('- ', '')}</Text>
          </View>
        );
      } else if (trimmedLine.length > 0) {
        elements.push(
          <Text key={`p-${index}`} style={styles.paragraph}>
            {trimmedLine}
          </Text>
        );
      }
    });
    return elements;
  };

  // === Content ===
  const Content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* --- 総合スコア --- */}
      {analysisResult.overall_score && (
        <Card style={[styles.scoreCard, { backgroundColor: skin.background, borderColor: skin.primary, borderWidth: 1 }]}>
          <Card.Content style={styles.scoreContent}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Image
                source={require('../../assets/tossup2.png')}
                style={{ width: 40, height: 40, resizeMode: 'contain' }}
              />
            </View>
            <Text style={[styles.scoreLabel, { color: skin.text }]}>
              {TITLES.score[locale] || TITLES.score.en}
            </Text>
            <Text style={[styles.scoreValue, { color: skin.primary }]}>
              {Number(analysisResult.overall_score).toFixed(1)}
            </Text>
            <Text style={styles.outOfTen}>/10</Text>
            <Text style={styles.skillLevelLabel}>
              {'\n'}{getSkillLevel(Number(analysisResult.overall_score), locale)}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --- フェーズ別評価 --- */}
      {analysisResult.phase_scores && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.phase[locale] || TITLES.phase.en}
            </Text>
            <Divider style={styles.divider} />
            {Object.entries(analysisResult.phase_scores).map(([phase, score]) => (
              <View key={phase} style={styles.phaseItem}>
                <Text style={[styles.phaseLabel, { color: skin.text }]}>{phase}</Text>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.phaseScore, { color: skin.primary }]}>{score}/10</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { backgroundColor: skin.primary, width: `${(score / 10) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* --- オーバーレイ画像 --- */}
      {analysisResult.overlay_images && analysisResult.overlay_images.length > 0 && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.overlay[locale] || TITLES.overlay.en}
            </Text>
            <ScrollView>
              {analysisResult.overlay_images.map((img, idx) => (
                <View key={idx} style={{ marginRight: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: skin.text, marginBottom: 8 }}>
                    Pose {idx + 1}
                  </Text>
                  <Image
                    source={{ uri: 'http://192.168.10.117:5001' + img }}
                    style={{
                      width: 220,
                      height: 140,
                      borderRadius: 12,
                      backgroundColor: '#ccc',
                      resizeMode: 'contain'
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* --- 基本解析結果 --- */}
      {analysisResult.basic_analysis && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.analysis[locale] || TITLES.analysis.en}
            </Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.basic_analysis}</Text>
          </Card.Content>
        </Card>
      )}

      {/* --- Basic Advice --- */}
      {analysisResult.advice && analysisResult.advice.basic_advice && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.advice[locale] || TITLES.advice.en}
            </Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.advice.basic_advice}</Text>
          </Card.Content>
        </Card>
      )}

      {/* --- 技術ポイント --- */}
      {analysisResult.advice?.technical_points && analysisResult.advice.technical_points.length > 0 && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.tech[locale] || TITLES.tech.en}
            </Text>
            <Divider style={styles.divider} />
            {analysisResult.advice.technical_points.map((point, idx) => (
              <Text key={idx} style={[styles.analysisText, { color: skin.text }]}>{point}</Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* --- 練習提案 --- */}
      {analysisResult.advice?.practice_suggestions && analysisResult.advice.practice_suggestions.length > 0 && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {TITLES.practice[locale] || TITLES.practice.en}
            </Text>
            <Divider style={styles.divider} />
            {analysisResult.advice.practice_suggestions.map((suggestion, idx) => (
              <Text key={idx} style={[styles.analysisText, { color: skin.text }]}>{suggestion}</Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* --- AI詳細アドバイス --- */}
      <Card style={[styles.card, { backgroundColor: skin.background }]}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: skin.primary }]}>
            {TITLES.ai[locale] || TITLES.ai.en}
          </Text>
          <Divider style={styles.divider} />
          {analysisResult.advice?.detailed_advice
            ? <View>{formatAIResponse(analysisResult.advice.detailed_advice)}</View>
            : <Text style={{ color: '#888' }}>
                {locale === 'ja'
                  ? "AIによる詳細アドバイスはプレミアムユーザーのみ利用可能です。"
                  : "Detailed advice is only available for premium users."}
              </Text>
          }

          {/* ワンポイントアドバイス */}
          {analysisResult.advice?.one_point_advice && (
            <View style={styles.adviceSection}>
              <Text style={[styles.adviceTitle, { color: skin.accent }]}>
                {TITLES.onepoint[locale] || TITLES.onepoint.en}
              </Text>
              <View style={styles.adviceContent}>
                {formatAIResponse(analysisResult.advice.one_point_advice)}
              </View>
            </View>
          )}

          {/* 改善プログラム */}
          {analysisResult.advice?.improvement_program && (
            <View style={styles.adviceSection}>
              <Text style={[styles.adviceTitle, { color: skin.accent }]}>
                {TITLES.program[locale] || TITLES.program.en}
              </Text>
              <View style={styles.adviceContent}>
                {formatAIResponse(analysisResult.advice.improvement_program)}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* --- アクションボタン --- */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={[styles.button, { backgroundColor: skin.primary }]}
          icon="refresh"
          labelStyle={{ color: skin.text === '#f8f8f8' ? '#fff' : skin.text }}
        >
          {NEW_ANALYSIS_LABELS[locale] || NEW_ANALYSIS_LABELS['en']}
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            // 今後実装予定
            console.log('シェア機能は今後実装予定');
          }}
          style={styles.button}
          icon="share"
          labelStyle={{ color: skin.primary }}
        >
          {SHARE_RESULTS_LABELS[locale] || SHARE_RESULTS_LABELS['en']}
        </Button>
      </View>
    </ScrollView>
  );

  // グラデーション分岐
  const GradientComponent = isPremium ? gradientComponents[skinKey] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: skin.background }]}>
      {GradientComponent ? (
        <GradientComponent>
          {Content}
        </GradientComponent>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
};

// ... styles はそのままコピペOK

// ↓↓↓ styles部分は省略可能。いままでのをそのまま使ってOK ↓↓↓

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  scoreCard: { 
    marginBottom: 16, 
    elevation: 6, 
    borderRadius: 18, 
    alignItems: 'center', 
    paddingVertical: 32,
  },
  scoreContent: { 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  scoreLabel: { 
    fontSize: 22, 
    marginBottom: 12, 
    fontWeight: '500',
    letterSpacing: 1,
  },
  scoreValue: { 
    fontSize: 70,
    fontWeight: 'bold', 
    marginBottom: 0, 
    lineHeight: 78,
    textAlign: 'center',
  },
    outOfTen: { 
    fontSize: 24, 
    color: '#999', 
    marginBottom: 0, 
    marginTop: -8,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 2,
  },
  skillLevelLabel: {
    fontSize: 22,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  scoreDescription: { fontSize: 14, textAlign: 'center' },
  card: { marginBottom: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  divider: { marginBottom: 16 },
  phaseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  phaseLabel: { fontSize: 16, flex: 1, fontWeight: '500' },
  scoreContainer: { alignItems: 'flex-end', flex: 1 },
  phaseScore: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  scoreBar: { width: 80, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%' },
  analysisText: { fontSize: 14, lineHeight: 22 },
  adviceSection: { marginBottom: 24 },
  adviceTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  adviceContent: { paddingLeft: 8 },
  heading2: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  bullet: { marginRight: 8, fontSize: 14 },
  numberBullet: { marginRight: 8, fontSize: 14, fontWeight: 'bold' },
  listText: { flex: 1, fontSize: 14, lineHeight: 20 },
  buttonContainer: { marginTop: 16, gap: 12 },
  button: { marginVertical: 4 },
});

export default ResultScreen;