import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { Button, Card, ProgressBar, IconButton, TextInput, Switch } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ImageViewing from 'react-native-image-viewing';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSkin } from '../SkinContext';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';

const API_BASE_URL = 'http://192.168.10.117:5000';
const FREE_LIMIT = 3;

const HomeScreen = ({ navigation }) => {
  const { skin, skinStyle, skinKey, isPremium, setIsPremium } = useSkin();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userConcerns, setUserConcerns] = useState('');
  const [showShootingGuide, setShowShootingGuide] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  // 利用回数・日付リセット
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        setError(null);
        setCurrentStep(1);
        setUploadProgress(0);
        setUserConcerns('');
        const today = new Date().toLocaleDateString();
        const usageDate = await AsyncStorage.getItem('usageDate');
        if (usageDate !== today) {
          await AsyncStorage.setItem('usageDate', today);
          await AsyncStorage.setItem('usageCount', '0');
          setUsageCount(0);
        } else {
          const count = parseInt(await AsyncStorage.getItem('usageCount') || '0');
          setUsageCount(count);
        }
      })();
    }, [])
  );

  // ファイル選択
  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size > 100 * 1024 * 1024) {
          Alert.alert('エラー', 'ファイルサイズが大きすぎます。100MB以下のファイルを選択してください。');
          return;
        }
        setSelectedFile(file);
        setError(null);
        setCurrentStep(2);
        Toast.show({
          type: 'success',
          text1: 'ファイル選択完了',
          text2: file.name,
        });
      }
    } catch (err) {
      console.error('ファイル選択エラー:', err);
      Alert.alert('エラー', 'ファイル選択中にエラーが発生しました。');
    }
  };

  // カメラで撮影
  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', 'カメラへのアクセス権限が必要です。');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: `tennis_serve_${Date.now()}.mp4`,
          type: 'video/mp4',
          size: file.fileSize || 0,
        });
        setError(null);
        setCurrentStep(2);
        Toast.show({
          type: 'success',
          text1: '動画撮影完了',
          text2: '解析を開始できます',
        });
      }
    } catch (err) {
      console.error('カメラエラー:', err);
      Alert.alert('エラー', '動画撮影中にエラーが発生しました。');
    }
  };

  // 解析実行
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    const today = new Date().toLocaleDateString();
    const usageDate = await AsyncStorage.getItem('usageDate');
    let count = parseInt(await AsyncStorage.getItem('usageCount') || '0');
    if (usageDate !== today) {
      count = 0;
      await AsyncStorage.setItem('usageDate', today);
      await AsyncStorage.setItem('usageCount', '0');
    }
    if (!isPremium && count >= FREE_LIMIT) {
      setError(
        '無料枠の1日あたりの解析回数（3回）に達しました。\nプレミアムプラン（解析回数無制限、広告表示無し、AIによる詳細アドバイス表示！）を御検討ください。'
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: selectedFile.uri,
        type: selectedFile.type || 'video/mp4',
        name: selectedFile.name || 'video.mp4',
      });
      if (isPremium && userConcerns.trim()) {
        formData.append('user_concerns', userConcerns);
      }
      formData.append('is_premium', isPremium ? 'true' : 'false');

      const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (response.data && response.data.success && response.data.result) {
        setAnalysisResult(response.data.result);
        setCurrentStep(3);
        Toast.show({ type: 'success', text1: '解析完了', text2: '結果を確認してください' });
        navigation.navigate('Result', {
          analysisResult: response.data.result,
        });
        if (!isPremium) {
          await AsyncStorage.setItem('usageCount', (count + 1).toString());
          setUsageCount(count + 1);
        }
      } else {
        setError('解析結果の形式が正しくありません');
      }
    } catch (err) {
      console.error('解析エラー:', err);
      setError('解析中にエラーが発生しました。もう一度お試しください。');
      Toast.show({
        type: 'error',
        text1: '解析エラー',
        text2: 'もう一度お試しください',
      });
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentStep(1);
    setError(null);
    setUploadProgress(0);
    setUserConcerns('');
  };

  const shootingGuideImages = [require('../../assets/images/camera_guide.png')];

  // ======== ここから分岐UIラップ ========
  const isGradient = isPremium && skinKey === 'gradient-blue';

  const Content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={[styles.title, skinStyle.title]}>Tennis Serve Analyzer</Text>
        {/* サブタイトル＋FAQアイコンを横並び */}
        <View style={styles.subtitleRow}>
          <Text style={[styles.subtitle, skinStyle.subtitle]}>
            AI を活用したテニスサーブ動作解析
          </Text>
          <IconButton
            icon="help-circle-outline"
            size={22}
            onPress={() => navigation.navigate('FAQ')}
            style={styles.faqIcon}
            iconColor="#1976d2"
            accessibilityLabel="よくある質問"
          />
        </View>
        {!isPremium && (
          <Text style={[{ color: '#e53935', marginTop: 8, fontSize: 15 }, skinStyle.info]}>
            本日の無料解析残回数：{Math.max(0, FREE_LIMIT - usageCount)} / {FREE_LIMIT}
          </Text>
        )}
      </View>

      {/* ステップ1: ファイル選択 */}
      {(currentStep === 1 || (currentStep === 2 && !selectedFile)) && (
        <Card style={[styles.card, skinStyle.card]}>
          <Card.Content>
            <Text style={[styles.cardTitle, skinStyle.cardTitle]}>動画を選択してください</Text>
            <Text style={[styles.cardDescription, skinStyle.cardDescription]}>
              テニスサーブの動画をアップロードするか、カメラで撮影してください
            </Text>
            {isPremium && (
              <TextInput
                label="悩んでいることをここに記載してね（任意）"
                value={userConcerns}
                onChangeText={setUserConcerns}
                placeholder="例：フォームが安定しない、パワーが出ない..."
                style={[{ marginTop: 12, backgroundColor: '#fff' }, skinStyle.textInput]}
                multiline
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Switch value={isPremium} onValueChange={setIsPremium} />
              <Text style={{ marginLeft: 8 }}>
                {isPremium
                  ? 'プレミアム（詳細AIアドバイスあり）'
                  : '無料モード（簡易解析のみ）'}
              </Text>
            </View>
            <View style={styles.guideButtonContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowShootingGuide(true)}
                style={styles.guideButton}
                icon="information"
                compact
              >
                撮影ガイド
              </Button>
            </View>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleDocumentPicker}
                style={styles.button}
                icon="file-video"
              >
                ファイルを選択
              </Button>
              <Button
                mode="outlined"
                onPress={handleCameraCapture}
                style={styles.button}
                icon="camera"
              >
                カメラで撮影
              </Button>
            </View>
            <Text style={styles.note}>
              対応形式: MP4, AVI, MOV, MKV (最大100MB)
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* ステップ2: ファイル選択済み（解析開始画面） */}
      {currentStep === 2 && selectedFile && (
        <Card style={[styles.card, skinStyle.card]}>
          <Card.Content>
            <Text style={[styles.cardTitle, skinStyle.cardTitle]}>解析準備完了</Text>
            <Text style={[styles.cardDescription, skinStyle.cardDescription]}>
              選択されたファイル: {selectedFile.name}
            </Text>
            {isPremium && (
              <TextInput
                label="サーブについて悩んでいること（任意）"
                value={userConcerns}
                onChangeText={setUserConcerns}
                placeholder="例：フォームが安定しない、パワーが出ない..."
                style={[{ marginTop: 12, backgroundColor: '#fff' }, skinStyle.textInput]}
                multiline
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
              <Switch value={isPremium} onValueChange={setIsPremium} />
              <Text style={{ marginLeft: 8 }}>
                {isPremium
                  ? 'プレミアム（詳細AIアドバイスあり）'
                  : '無料モード（簡易解析のみ）'}
              </Text>
            </View>
            {isAnalyzing ? (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>解析中...</Text>
                <ProgressBar progress={uploadProgress / 100} style={styles.progressBar} />
                <Text style={styles.progressPercent}>{uploadProgress}%</Text>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleAnalyze}
                  style={styles.button}
                  icon="play"
                >
                  解析開始
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleReset}
                  style={styles.button}
                  icon="refresh"
                >
                  やり直し
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {error && (
        <Card style={[styles.errorCard, skinStyle.errorCard]}>
          <Card.Content>
            <Text style={[styles.errorText, skinStyle.errorText]}>
              {error.split('\n').map((line, idx) => (
                <Text key={idx}>{line}{'\n'}</Text>
              ))}
            </Text>
          </Card.Content>
        </Card>
      )}
      <Toast />
    </ScrollView>
  );

  // ========= グラデーション背景 or 通常背景 ===========

  const GuideModal = (
    <ImageViewing
      images={shootingGuideImages}
      imageIndex={0}
      visible={showShootingGuide}
      onRequestClose={() => setShowShootingGuide(false)}
      HeaderComponent={({ onRequestClose }) => (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>撮影ガイド</Text>
          <IconButton
            icon="close"
            iconColor="#fff"
            size={28}
            onPress={() => {
              setShowShootingGuide(false);
              if (onRequestClose) onRequestClose();
            }}
            style={{ margin: 0, padding: 0, backgroundColor: 'rgba(40,40,40,0.4)' }}
          />
        </View>
      )}
      FooterComponent={() => (
        <View style={styles.modalFooter}>
          <Text style={styles.modalFooterText}>
            正確な解析のために、ガイドに従って撮影してください。
          </Text>
        </View>
      )}
    />
  );

  if (isGradient) {
    return (
      <AnimatedGradientBackground>
        <SafeAreaView style={[styles.container, skinStyle.background]}>
          {Content}
          {GuideModal}
        </SafeAreaView>
      </AnimatedGradientBackground>
    );
  } else {
    return (
      <SafeAreaView style={[styles.container, skinStyle.background]}>
        {Content}
        {GuideModal}
      </SafeAreaView>
    );
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
  // サブタイトルとFAQアイコン横並び
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginRight: 2 },
  faqIcon: {
    marginLeft: 2,
    marginRight: -10, // お好みで微調整
    backgroundColor: 'transparent',
    elevation: 0,
  },
  card: { marginBottom: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  guideButtonContainer: { alignItems: 'center', marginBottom: 16 },
  guideButton: { borderColor: '#4caf50', borderWidth: 1 },
  buttonContainer: { gap: 12, marginVertical: 8 },
  button: { marginVertical: 4 },
  note: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 16 },
  progressContainer: { alignItems: 'center' },
  progressText: { fontSize: 16, marginBottom: 8 },
  progressBar: { width: '100%', height: 8, marginBottom: 8 },
  progressPercent: { fontSize: 14, color: '#666' },
  errorCard: { backgroundColor: '#ffebee', marginBottom: 16 },
  errorText: { color: '#c62828', textAlign: 'center' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 99,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  modalFooter: { padding: 16, backgroundColor: 'rgba(0, 0, 0, 0.8)', alignItems: 'center' },
  modalFooterText: { fontSize: 14, color: '#fff', textAlign: 'center', lineHeight: 20 },
});

export default HomeScreen;