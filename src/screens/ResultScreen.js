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

const { width } = Dimensions.get('window');

const ResultScreen = ({ route, navigation }) => {
  const { analysisResult } = route.params;

  // デバッグ用に全データ表示
  console.log('★★ResultScreen analysisResult', analysisResult);
  console.log('★★advice', analysisResult.advice);

  // マークダウン軽処理
  const formatAIResponse = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      // 各見出しやリスト判定
      if (trimmedLine.startsWith('【') && trimmedLine.endsWith('】')) {
        elements.push(
          <Text key={`h2-${index}`} style={styles.heading2}>
            {trimmedLine}
          </Text>
        );
      } else if (/^\d+\./.test(trimmedLine)) {
        // 番号リスト
        elements.push(
          <View key={`ol-${index}`} style={styles.listItem}>
            <Text style={styles.numberBullet}>{trimmedLine.match(/^\d+\./)[0]}</Text>
            <Text style={styles.listText}>{trimmedLine.replace(/^\d+\.\s*/, '')}</Text>
          </View>
        );
      } else if (trimmedLine.startsWith('- ')) {
        elements.push(
          <View key={`li-${index}`} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* 総合スコア */}
        {analysisResult.overall_score && (
          <Card style={styles.scoreCard}>
            <Card.Content style={styles.scoreContent}>
              <Text style={styles.scoreLabel}>総合スコア</Text>
              <Text style={styles.scoreValue}>
                {Number(analysisResult.overall_score).toFixed(2)}/10
              </Text>
              <Text style={styles.scoreDescription}>
                あなたのテニスサーブの総合評価です
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* フェーズ別評価 */}
        {analysisResult.phase_scores && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>フェーズ別評価</Text>
              <Divider style={styles.divider} />
              {Object.entries(analysisResult.phase_scores).map(([phase, score]) => (
                <View key={phase} style={styles.phaseItem}>
                  <Text style={styles.phaseLabel}>{phase}</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.phaseScore}>{score}/10</Text>
                    <View style={styles.scoreBar}>
                      <View 
                        style={[
                          styles.scoreBarFill, 
                          { width: `${(score / 10) * 100}%` }
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
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>オーバーレイ画像</Text>
              <ScrollView>
                {analysisResult.overlay_images.map((img, idx) => (
                  <View key={idx} style={{ marginRight: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
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
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>基本解析結果</Text>
              <Divider style={styles.divider} />
              <Text style={styles.analysisText}>{analysisResult.basic_analysis}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Basic Advice（必ず表示） */}
        {analysisResult.advice && analysisResult.advice.basic_advice && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>基本アドバイス</Text>
              <Divider style={styles.divider} />
              <Text style={styles.analysisText}>{analysisResult.advice.basic_advice}</Text>
            </Card.Content>
          </Card>
        )}

        {/* AI詳細アドバイス */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>AI詳細アドバイス</Text>
            <Divider style={styles.divider} />
            {/* 詳細アドバイス */}
            <Text style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 8 }}>
              {analysisResult.advice?.enhanced ? 'ChatGPTによる詳細アドバイス' : '基本アドバイス'}
            </Text>
            {analysisResult.advice?.detailed_advice
              ? <View>{formatAIResponse(analysisResult.advice.detailed_advice)}</View>
              : <Text style={{ color: '#888' }}>詳細アドバイスはありません。</Text>
            }

            {/* ワンポイントアドバイス（あれば） */}
            {analysisResult.advice?.one_point_advice && (
              <View style={styles.adviceSection}>
                <Text style={styles.adviceTitle}>ワンポイントアドバイス</Text>
                <View style={styles.adviceContent}>
                  {formatAIResponse(analysisResult.advice.one_point_advice)}
                </View>
              </View>
            )}

            {/* その他アドバイス項目（improvement_program等） */}
            {analysisResult.advice?.improvement_program && (
              <View style={styles.adviceSection}>
                <Text style={styles.adviceTitle}>改善プログラム</Text>
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
            style={styles.button}
            icon="refresh"
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
          >
            結果をシェア
          </Button>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  scoreCard: { marginBottom: 16, elevation: 6, backgroundColor: '#e3f2fd' },
  scoreContent: { alignItems: 'center', paddingVertical: 24 },
  scoreLabel: { fontSize: 18, color: '#666', marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
  scoreDescription: { fontSize: 14, color: '#666', textAlign: 'center' },
  card: { marginBottom: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#1976d2' },
  divider: { marginBottom: 16 },
  phaseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  phaseLabel: { fontSize: 16, flex: 1, fontWeight: '500' },
  scoreContainer: { alignItems: 'flex-end', flex: 1 },
  phaseScore: { fontSize: 16, fontWeight: 'bold', color: '#1976d2', marginBottom: 4 },
  scoreBar: { width: 80, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: '#1976d2' },
  analysisText: { fontSize: 14, lineHeight: 22, color: '#333' },
  adviceSection: { marginBottom: 24 },
  adviceTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 12 },
  adviceContent: { paddingLeft: 8 },
  heading2: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginTop: 16, marginBottom: 8 },
  heading3: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginTop: 12, marginBottom: 6 },
  heading4: { fontSize: 14, fontWeight: 'bold', color: '#7b1fa2', marginTop: 8, marginBottom: 4 },
  paragraph: { fontSize: 14, lineHeight: 20, color: '#333', marginBottom: 8 },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  bullet: { color: '#1976d2', marginRight: 8, fontSize: 14 },
  numberBullet: { color: '#2e7d32', marginRight: 8, fontSize: 14, fontWeight: 'bold' },
  listText: { flex: 1, fontSize: 14, lineHeight: 20, color: '#333' },
  buttonContainer: { marginTop: 16, gap: 12 },
  button: { marginVertical: 4 },
});

export default ResultScreen;
