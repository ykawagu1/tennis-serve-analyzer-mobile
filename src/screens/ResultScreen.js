// ResultScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  // Button ← react-native-paperを使うので不要
} from 'react-native';
import { Card, Button, Divider } from 'react-native-paper'; // Buttonはこちらのみ
import { useSkin } from '../SkinContext';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


// ...グラデーション背景 import（省略せずすべて）

import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import AnimatedRedGradientBackground from '../components/AnimatedRedGradientBackground';
import AnimatedPurpleGradientBackground from '../components/AnimatedPurpleGradientBackground';
import AnimatedSunsetGradientBackground from '../components/AnimatedSunsetGradientBackground';
import AnimatedGreenGradientBackground from '../components/AnimatedGreenGradientBackground';
import AnimatedRainbowGradientBackground from '../components/AnimatedRainbowGradientBackground';
import AnimatedNeonPulseBackground from '../components/AnimatedNeonPulseBackground';
import AnimatedNeonStrobeBackground from '../components/AnimatedNeonStrobeBackground';
import AnimatedAuroraBackground from '../components/AnimatedAuroraBackground';
import AnimatedCandyPopBackground from '../components/AnimatedCandyPopBackground';

// ===== normalize, pick, 各種定数（TITLESなど）を元コードどおり宣言 =====
const normalize = (lang) => {
  if (!lang) return 'en';
  const lower = String(lang).toLowerCase();
  if (lower === 'jp') return 'ja';
  if (lower.startsWith('pt')) return 'pt'; // pt-BR → pt
  if (lower.startsWith('zh')) return 'zh';
  return lower.slice(0, 2); // en-US → en / ja-JP → ja
};

const pick = (dict, locale) =>
  (dict && dict[locale]) ?? (dict && dict.en) ?? (dict && Object.values(dict)[0]);

// --- 各種多言語ラベル、TITLES, PHASE_LABELS, gradientComponents, getSkillLevelも元コードどおり省略せず記述 ---
const TITLES = {
  score:    { ja: '総合スコア',         en: 'Total Score',          de: 'Gesamtergebnis',     fr: 'Score total',        es: 'Puntuación total',     pt: 'Pontuação total' },
  phase:    { ja: 'フェーズ別スコア',     en: 'Phase Scores',         de: 'Phasenbewertung',    fr: 'Scores par phase',   es: 'Puntuación por fase',  pt: 'Pontuação por fase' },
  overlay:  { ja: 'オーバーレイ画像',     en: 'Overlay Images',       de: 'Overlay-Bilder',     fr: 'Images superposées', es: 'Imágenes de superposición', pt: 'Imagens de sobreposição' },
  analysis: { ja: '基本解析結果',         en: 'Basic Analysis',       de: 'Grundanalyse',       fr: 'Analyse de base',    es: 'Análisis básico',      pt: 'Análise básica' },
  advice:   { ja: '基本アドバイス',       en: 'Basic Advice',         de: 'Grundlegender Rat',  fr: 'Conseil de base',    es: 'Consejo básico',       pt: 'Conselho básico' },
  tech:     { ja: '技術ポイント',         en: 'Technical Points',     de: 'Technische Punkte',  fr: 'Points techniques',  es: 'Puntos técnicos',      pt: 'Pontos técnicos' },
  practice: { ja: '練習提案',             en: 'Practice Suggestions', de: 'Übungsvorschläge',   fr: 'Suggestions de pratique', es: 'Sugerencias de práctica', pt: 'Sugestões de prática' },
  ai:       { ja: 'AI詳細アドバイス',      en: 'Detailed AI Advice',   de: 'Detaillierter KI-Rat', fr: 'Conseil IA détaillé', es: 'Consejo detallado de IA', pt: 'Conselho detalhado de IA' },
  onepoint: { ja: 'ワンポイントアドバイス', en: 'One-point Advice',     de: 'Tipp des Tages',     fr: 'Conseil clé',        es: 'Consejo clave',        pt: 'Dica única' },
  program:  { ja: '改善プログラム',        en: 'Improvement Program',  de: 'Verbesserungsprogramm', fr: 'Programme d\'amélioration', es: 'Programa de mejora', pt: 'Programa de melhoria' },
};

const PHASE_LABELS = {
  preparation:    { ja: '準備',            en: 'Preparation',      de: 'Vorbereitung',   fr: 'Préparation',  es: 'Preparación',   pt: 'Preparação' },
  ball_toss:      { ja: 'トス',            en: 'Ball Toss',        de: 'Ballwurf',       fr: 'Lancer',       es: 'Lanzamiento',   pt: 'Lançamento' },
  trophy_position:{ ja: 'トロフィーポジション', en: 'Trophy Position', de: 'Trophy-Position', fr: 'Position trophy', es: 'Posición trophy', pt: 'Posição trophy' },
  acceleration:   { ja: '加速',            en: 'Acceleration',     de: 'Beschleunigung', fr: 'Accélération', es: 'Aceleración',   pt: 'Aceleração' },
  contact:        { ja: 'インパクト',      en: 'Contact',          de: 'Treffpunkt',     fr: 'Contact',      es: 'Contacto',      pt: 'Contato' },
  follow_through: { ja: 'フォロースルー',  en: 'Follow-through',   de: 'Ausschwung',     fr: 'Finish',       es: 'Terminación',   pt: 'Follow-through' },
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
  if (locale === 'ja') {
    if (score < 6) return '初級';
    if (score < 8) return '中級';
    return '上級';
  } else if (locale === 'de') {
    if (score < 6) return 'Anfänger';
    if (score < 8) return 'Mittelstufe';
    return 'Fortgeschritten';
  } else if (locale === 'fr') {
    if (score < 6) return 'Débutant';
    if (score < 8) return 'Intermédiaire';
    return 'Avancé';
  } else if (locale === 'es') {
    if (score < 6) return 'Principiante';
    if (score < 8) return 'Intermedio';
    return 'Avanzado';
  } else if (locale === 'pt') {
    if (score < 6) return 'Iniciante';
    if (score < 8) return 'Intermediário';
    return 'Avançado';
  }
  if (score < 6) return 'Beginner';
  if (score < 8) return 'Intermediate level';
  return 'Advanced level';
};

const NEW_ANALYSIS_LABELS = {
  ja: '新しい解析',
  en: 'New Analysis',
  de: 'Neue Analyse',
  fr: 'Nouvelle analyse',
  es: 'Nuevo análisis',
  pt: 'Nova análise',
};

const SHARE_RESULTS_LABELS = {
  ja: '結果をシェア',
  en: 'Share Results',
  de: 'Ergebnisse teilen',
  fr: 'Partager les résultats',
  es: 'Compartir resultados',
  pt: 'Compartilhar resultados',
};

const ResultScreen = ({ route, navigation }) => {

  const scoreCardRef = useRef();
  // キャプチャ&シェア関数
  const handleShareScoreCard = async () => {
    try {
      const uri = await captureRef(scoreCardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.error('シェア失敗:', err);
    }
  };

  // route, navigationを安全にガード（渡されていない場合は何も表示しない）
  if (!route || !route.params || !route.params.analysisResult) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>解析データが見つかりません。もう一度解析してください。</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>戻る</Button>
      </View>
    );
  }
  const { analysisResult } = route.params;

  useEffect(() => {
    console.log('[Result analysisResult]', JSON.stringify(analysisResult, null, 2));
  }, [analysisResult]);



  const { skin, skinKey, isPremium } = useSkin();
  const { t, i18n } = useTranslation();

  const locale = normalize(i18n.language);
  if (!i18n.isInitialized) return null;

// **テキスト** を <Text style={{fontWeight:'bold'}}> に変換
const applyBold = (line, textColor = '#fff') => {
  const parts = line.split(/(\*\*.*?\*\*)/); // **で囲まれた部分を分割
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={idx} style={{ fontWeight: 'bold', color: textColor }}>
          {part.slice(2, -2)}
        </Text>
      );
    } else {
      return (
        <Text key={idx} style={{ color: textColor }}>
          {part}
        </Text>
      );
    }
  });
};

// Markdown風整形 (##, ###, 【見出し】, *, -, 数字リスト, **bold**, *italic*)
const formatAIResponse = (text, textColor = '#fff') => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // ### 小見出し
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <Text key={`h3-${index}`} style={[styles.heading3, { color: textColor }]}>
          {applyBold(trimmedLine.replace(/^###\s*/, ''), textColor)}
        </Text>
      );

    // ## 見出し
    } else if (trimmedLine.startsWith('## ')) {
      elements.push(
        <Text key={`h2-${index}`} style={[styles.heading2, { color: textColor }]}>
          {applyBold(trimmedLine.replace(/^##\s*/, ''), textColor)}
        </Text>
      );

    // 【見出し】
    } else if (trimmedLine.startsWith('【') && trimmedLine.endsWith('】')) {
      elements.push(
        <Text key={`h2b-${index}`} style={[styles.heading2, { color: textColor }]}>
          {applyBold(trimmedLine, textColor)}
        </Text>
      );

    // 番号付きリスト (1. ...)
    } else if (/^\d+\./.test(trimmedLine)) {
      elements.push(
        <View key={`ol-${index}`} style={styles.listItem}>
          <Text style={[styles.numberBullet, { color: textColor }]}>
            {trimmedLine.match(/^\d+\./)[0]}
          </Text>
          <Text style={[styles.listText, { color: textColor }]}>
            {applyBold(trimmedLine.replace(/^\d+\.\s*/, ''), textColor)}
          </Text>
        </View>
      );

    // 箇条書き (- や * で始まる行)
    } else if (/^[-*]\s+/.test(trimmedLine)) {
      elements.push(
        <View key={`li-${index}`} style={styles.listItem}>
          <Text style={[styles.bullet, { color: textColor }]}>•</Text>
          <Text style={[styles.listText, { color: textColor }]}>
            {applyBold(trimmedLine.replace(/^[-*]\s+/, ''), textColor)}
          </Text>
        </View>
      );

    // 通常テキスト
    } else if (trimmedLine.length > 0) {
      elements.push(
        <Text key={`p-${index}`} style={[styles.paragraph, { color: textColor }]}>
          {applyBold(trimmedLine, textColor)}
        </Text>
      );
    }
  });

  return elements;
};

  // --- 本体UI ---
  const Content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* --- 総合スコア --- */}
      {analysisResult.overall_score && (
        <Card
          ref={scoreCardRef}
          style={[
            styles.scoreCard,
            { backgroundColor: skin.background, borderColor: skin.primary, borderWidth: 1 },
          ]}
        >
          <Card.Content style={styles.scoreContent}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Image
                source={require('../../assets/tossup2.png')}
                style={{ width: 40, height: 40, resizeMode: 'contain' }}
              />
            </View>
            <Text style={[styles.scoreLabel, { color: skin.text }]}>
              {pick(TITLES.score, locale)}
            </Text>
            <Text style={[styles.scoreValue, { color: skin.primary }]}>
              {Number(analysisResult.overall_score).toFixed(1)}
            </Text>
            <Text style={styles.outOfTen}>/10</Text>
            <Text style={styles.skillLevelLabel}>
              {'\n'}
              {getSkillLevel(Number(analysisResult.overall_score), locale)}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --- フェーズ別評価 --- */}
      {analysisResult.phase_scores && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {pick(TITLES.phase, locale)}
            </Text>
            <Divider style={styles.divider} />
            {Object.entries(analysisResult.phase_scores).map(([phase, score]) => (
              <View key={phase} style={styles.phaseItem}>
                <Text style={[styles.phaseLabel, { color: skin.text }]}>
                  {pick(PHASE_LABELS[phase] || {}, locale) || phase}
                </Text>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.phaseScore, { color: skin.primary }]}>
                    {score}/10
                  </Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { backgroundColor: skin.primary, width: `${(score / 10) * 100}%` },
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
              {pick(TITLES.overlay, locale)}
            </Text>
            <ScrollView>
              {analysisResult.overlay_images.map((img, idx) => (
                <View key={idx} style={{ marginRight: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: skin.text, marginBottom: 8 }}>
                    {locale === 'ja' ? `ポーズ ${idx + 1}` : `Pose ${idx + 1}`}
                  </Text>
                  <Image
                    source={{ uri: 'http://192.168.10.117:5001' + img }}
                    style={{
                      width: 220,
                      height: 140,
                      borderRadius: 12,
                      backgroundColor: '#ccc',
                      resizeMode: 'contain',
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
              {pick(TITLES.analysis, locale)}
            </Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>
              {analysisResult.basic_analysis}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --- Basic Advice --- */}
      {analysisResult.advice && analysisResult.advice.basic_advice && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {pick(TITLES.advice, locale)}
            </Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>
              {analysisResult.advice.basic_advice}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --- 技術ポイント --- */}
      {analysisResult.advice?.technical_points &&
        analysisResult.advice.technical_points.length > 0 && (
          <Card style={[styles.card, { backgroundColor: skin.background }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: skin.primary }]}>
                {pick(TITLES.tech, locale)}
              </Text>
              <Divider style={styles.divider} />
              {analysisResult.advice.technical_points.map((point, idx) => (
                <Text key={idx} style={[styles.analysisText, { color: skin.text }]}>
                  {point}
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}

      {/* --- 練習提案 --- */}
      {analysisResult.advice?.practice_suggestions &&
        analysisResult.advice.practice_suggestions.length > 0 && (
          <Card style={[styles.card, { backgroundColor: skin.background }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: skin.primary }]}>
                {pick(TITLES.practice, locale)}
              </Text>
              <Divider style={styles.divider} />
              {analysisResult.advice.practice_suggestions.map((suggestion, idx) => (
                <Text key={idx} style={[styles.analysisText, { color: skin.text }]}>
                  {suggestion}
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}

      {/* --- AI詳細アドバイス（ワンポイントアドバイスはここに入れない!） --- */}
      <Card style={[styles.card, { backgroundColor: skin.background }]}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: skin.primary }]}>
            {pick(TITLES.ai, locale)}
          </Text>
          <Divider style={styles.divider} />
          {analysisResult.advice?.detailed_advice ? (
            <View>{formatAIResponse(analysisResult.advice.detailed_advice, skin.text)}</View>
          ) : (
             <Text style={{ color: skin.text }}>
              {t('detailed_advice_premium_only')}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* --- ワンポイントアドバイス（独立カードとして1回だけ） --- */}
      {analysisResult.advice?.one_point_advice && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {pick(TITLES.onepoint, locale)}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.adviceContent}>
              {formatAIResponse(analysisResult.advice.one_point_advice, skin.text)}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* --- 改善プログラム --- */}
      {analysisResult.advice?.improvement_program && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>
              {pick(TITLES.program, locale)}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.adviceContent}>
              {formatAIResponse(analysisResult.advice.improvement_program, skin.text)}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* --- アクションボタン --- */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={[styles.button, { backgroundColor: skin.primary }]}
          icon="refresh"
          labelStyle={{ color: skin.text === '#f8f8f8' ? '#fff' : skin.text }}
        >
          {pick(NEW_ANALYSIS_LABELS, locale)}
        </Button>
        
        
        <Button
          mode="outlined"
          onPress={handleShareScoreCard}   // ←これでOK
          style={styles.button}
          icon="share"
          labelStyle={{ color: skin.primary }}
        >
          {pick(SHARE_RESULTS_LABELS, locale)}
        </Button>
      </View>
    </ScrollView>
  );

  // グラデーション分岐
  const GradientComponent = isPremium ? gradientComponents[skinKey] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: skin.background }]}>
      {GradientComponent ? <GradientComponent>{Content}</GradientComponent> : Content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ...省略せず全スタイル貼り付けてください...
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
  phaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phaseLabel: { fontSize: 16, flex: 1, fontWeight: '500' },
  scoreContainer: { alignItems: 'flex-end', flex: 1 },
  phaseScore: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  scoreBar: {
    width: 80,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
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
  heading3: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
});

export default ResultScreen;