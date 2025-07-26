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

const { width } = Dimensions.get('window');

const ResultScreen = ({ route, navigation }) => {
  const { analysisResult } = route.params;
  const { skin } = useSkin(); // skinStyleは使わずskinのみ

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: skin.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 総合スコア */}
        {analysisResult.overall_score && (
          <Card style={[styles.scoreCard, { backgroundColor: skin.background, borderColor: skin.primary, borderWidth: 1 }]}>
            <Card.Content style={styles.scoreContent}>
              <Text style={[styles.scoreLabel, { color: skin.text }]}>総合スコア</Text>
              <Text style={[styles.scoreValue, { color: skin.primary }]}>
                {Number(analysisResult.overall_score).toFixed(2)}/10
              </Text>
              <Text style={[styles.scoreDescription, { color: skin.text }]}>
                あなたのテニスサーブの総合評価です
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* フェーズ別評価 */}
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

        {/* オーバーレイ画像表示 */}
        {analysisResult.overlay_images && analysisResult.overlay_images.length > 0 && (
          <Card style={[styles.card, { backgroundColor: skin.background }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: skin.primary }]}>オーバーレイ画像</Text>
              <ScrollView horizontal>
                {analysisResult.overlay_images.map((img, idx) => (
                  <View key={idx} style={{ marginRight: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: skin.text, marginBottom: 8 }}>
                      ポーズ {idx + 1}
                    </Text>
                    <Image
                      source={{ uri: 'http://192.168.10.105:5000' + img }}
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

        {/* 基本解析結果 */}
        {analysisResult.basic_analysis && (
          <Card style={[styles.card, { backgroundColor: skin.background }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: skin.primary }]}>基本解析結果</Text>
              <Divider style={styles.divider} />
              <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.basic_analysis}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Basic Advice */}
        {analysisResult.advice && analysisResult.advice.basic_advice && (
          <Card style={[styles.card, { backgroundColor: skin.background }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: skin.primary }]}>基本アドバイス</Text>
              <Divider style={styles.divider} />
              <Text style={[styles.analysisText, { color: skin.text }]}>{analysisResult.advice.basic_advice}</Text>
            </Card.Content>
          </Card>
        )}

        {/* AI詳細アドバイス */}
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

        {/* アクションボタン */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  scoreCard: { marginBottom: 16, elevation: 6 },
  scoreContent: { alignItems: 'center', paddingVertical: 24 },
  scoreLabel: { fontSize: 18, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', marginBottom: 8 },
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
