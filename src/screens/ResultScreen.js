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

// 各グラデーション背景をインポート
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

const { width } = Dimensions.get('window');

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

// --- 追加：総合スコアからレベル名を返す関数 ---
const getSkillLevel = (score) => {
  if (score < 6) return '初心者';
  if (score < 8) return '中級者';
  return '上級者';
};

const ResultScreen = ({ route, navigation }) => {
  const { analysisResult } = route.params;
  const { skin, skinKey, isPremium } = useSkin();

  // 軽いMarkdown風整形
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

  // メインContent部分
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



            <Text style={[styles.scoreLabel, { color: skin.text }]}>Total Score</Text>
            <Text style={[styles.scoreValue, { color: skin.primary }]}>
              {Number(analysisResult.overall_score).toFixed(1)}
            </Text>
            <Text style={styles.outOfTen}>/10</Text>
            {/* ↓↓↓ ここで一行空けてラベルを表示 ↓↓↓ */}
            <Text style={styles.skillLevelLabel}>
              {'\n'}{getSkillLevel(Number(analysisResult.overall_score))}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* --- フェーズ別評価 --- */}
      {analysisResult.phase_scores && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>フェーズ別評価</Text>
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
            <Text style={[styles.cardTitle, { color: skin.primary }]}>オーバーレイ画像</Text>
            <ScrollView >
              {analysisResult.overlay_images.map((img, idx) => (
                <View key={idx} style={{ marginRight: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: skin.text, marginBottom: 8 }}>
                    ポーズ {idx + 1}
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
            <Text style={[styles.cardTitle, { color: skin.primary }]}>基本解析結果</Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.basic_analysis}</Text>
          </Card.Content>
        </Card>
      )}

      {/* --- Basic Advice --- */}
      {analysisResult.advice && analysisResult.advice.basic_advice && (
        <Card style={[styles.card, { backgroundColor: skin.background }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: skin.primary }]}>基本アドバイス</Text>
            <Divider style={styles.divider} />
            <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.advice.basic_advice}</Text>
          </Card.Content>
        </Card>
      )}

      {/* --- AI詳細アドバイス --- */}
      <Card style={[styles.card, { backgroundColor: skin.background }]}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: skin.primary }]}>AI詳細アドバイス</Text>
          <Divider style={styles.divider} />
          <Text style={[{ fontWeight: 'bold', marginBottom: 8, color: skin.text }]}>
            {analysisResult.advice?.enhanced ? 'ChatGPTによる詳細アドバイス' : '基本アドバイス'}
          </Text>
          {analysisResult.advice?.detailed_advice
            ? <View>{formatAIResponse(analysisResult.advice.detailed_advice)}</View>
            : <Text style={{ color: '#888' }}>無料ユーザーには詳細アドバイスを表示しません。</Text>
          }

          {/* ワンポイントアドバイス */}
          {analysisResult.advice?.one_point_advice && (
            <View style={styles.adviceSection}>
              <Text style={[styles.adviceTitle, { color: skin.accent }]}>ワンポイントアドバイス</Text>
              <View style={styles.adviceContent}>
                {formatAIResponse(analysisResult.advice.one_point_advice)}
              </View>
            </View>
          )}

          {/* 改善プログラム */}
          {analysisResult.advice?.improvement_program && (
            <View style={styles.adviceSection}>
              <Text style={[styles.adviceTitle, { color: skin.accent }]}>改善プログラム</Text>
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
          新しい解析
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
          結果をシェア
        </Button>
      </View>
    </ScrollView>
  );

  // ===== グラデ背景分岐（5パターン） =====
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  scoreCard: { 
    marginBottom: 16, 
    elevation: 6, 
    borderRadius: 18, 
    alignItems: 'center', 
    paddingVertical: 32, // 上下余白を増やす 
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
    fontSize: 70, // さらに大きく
    fontWeight: 'bold', 
    marginBottom: 0, 
    lineHeight: 78,
    textAlign: 'center',
  },
  outOfTen: { 
    fontSize: 24, 
    color: '#999', 
    marginBottom: 0, 
    marginTop: -8, // 8.5と詰める
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 2,
  },
  skillLevelLabel: {
    fontSize: 22,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 16, // 一行空ける
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