// src/screens/HomeScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, Image,
} from 'react-native';
import { Button, Card, IconButton, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ImageViewing from 'react-native-image-viewing';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useSkin } from '../SkinContext';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import { BannerAd, BannerAdSize, InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const API_BASE_URL = 'http://192.168.10.117:5001';
const FREE_LIMIT = 3;
const INTERSTITIAL_SHOWN_KEY = 'interstitial_shown_date';

const HomeScreen = ({ navigation }) => {
  const { skin, skinStyle, skinKey, isPremium, setIsPremium } = useSkin();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userConcerns, setUserConcerns] = useState('');
  const [showShootingGuide, setShowShootingGuide] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  // 広告
  const interstitialRef = useRef(
    InterstitialAd.createForAdRequest(
      __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
    )
  );
  const [adLoaded, setAdLoaded] = useState(false);
  const [postAdWaiting, setPostAdWaiting] = useState(false);

  // 遷移・状態フラグ
  const analysisDoneRef = useRef(false);
  const navigatedRef = useRef(false);
  const resultRef = useRef(null);
  const adWillShowRef = useRef(false);      // 今回「広告を出す予定」か
  const analyzeWatchdogRef = useRef(null);  // 60秒 watchdog

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  useEffect(() => {
    console.log('[BOOT] API_BASE_URL =', API_BASE_URL);
  }, []);

  // Interstitial lifecycle
  useEffect(() => {
    const interstitial = interstitialRef.current;

    const subLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[AD] interstitial LOADED');
      setAdLoaded(true);
    });

    const subClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[AD] interstitial CLOSED');
      setAdLoaded(false);
      // 広告の役目は終わり。待機は下げる
      setPostAdWaiting(false);

      if (analysisDoneRef.current) {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          console.log('[NAV] go Result (after ad close, analysis already done)');
          navigation.navigate('Result', { analysisResult: resultRef.current });
        }
      } else {
        // 解析未完 → 待機を表示しておく
        setPostAdWaiting(true);
      }
      interstitial.load();
    });

    const subError = interstitial.addAdEventListener(AdEventType.ERROR, (e) => {
      console.log('[AD] interstitial ERROR', e);
      setAdLoaded(false);
      setTimeout(() => interstitial.load(), 4000);
    });

    interstitial.load();

    return () => {
      subLoaded();
      subClosed();
      subError();
      if (analyzeWatchdogRef.current) {
        clearTimeout(analyzeWatchdogRef.current);
        analyzeWatchdogRef.current = null;
      }
    };
  }, [navigation]);

  // ヘッダーロゴ
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/tossup2.png')}
              style={{ width: 32, height: 32, resizeMode: 'contain', marginRight: 8 }}
            />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000', letterSpacing: 1 }}>
              Toss Up!
            </Text>
          </View>
        ),
      });
    }, [navigation])
  );

  // 利用回数・日付リセット
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        resultRef.current = null;
        setError(null);
        setCurrentStep(1);
        setUserConcerns('');
        setIsSelecting(false);
        setIsAnalyzing(false);
        adWillShowRef.current = false;
        analysisDoneRef.current = false;
        navigatedRef.current = false;

        const today = new Date().toLocaleDateString();
        const usageDate = await AsyncStorage.getItem('usageDate');
        if (usageDate !== today) {
          await AsyncStorage.setItem('usageDate', today);
          await AsyncStorage.setItem('usageCount', '0');
          setUsageCount(0);
        } else {
          const count = parseInt((await AsyncStorage.getItem('usageCount')) || '0');
          setUsageCount(count);
        }
      })();
    }, [])
  );

  // フォトライブラリから動画選択（deprecation対応）
  const handleImageLibraryPicker = async () => {
    try {
      setIsSelecting(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setIsSelecting(false);
        Alert.alert(t('permission_error_title'), t('permission_error_media_library'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      setIsSelecting(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.fileSize > 100 * 1024 * 1024) {
          Alert.alert(t('file_size_error_title'), t('file_size_error_message'));
          return;
        }
        setSelectedFile({
          uri: file.uri,
          name: file.fileName || `video_${Date.now()}.mp4`,
          type: file.type || 'video/mp4',
          size: file.fileSize || 0,
        });
        setError(null);
        setCurrentStep(2);
        Toast.show({
          type: 'success',
          text1: t('video_selected_success'),
          text2: file.fileName || t('video_selected'),
        });
      }
    } catch (err) {
      setIsSelecting(false);
      console.error('動画選択エラー:', err);
      Alert.alert(t('error_title'), t('video_select_error'));
    }
  };

  // カメラで撮影（deprecation対応）
  const handleCameraCapture = async () => {
    try {
      setIsSelecting(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setIsSelecting(false);
        Alert.alert(t('permission_error_title'), t('permission_error_camera'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 60,
      });

      setIsSelecting(false);

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
          text1: t('video_capture_success'),
          text2: t('ready_to_analyze'),
        });
      }
    } catch (err) {
      setIsSelecting(false);
      console.error('カメラエラー:', err);
      Alert.alert(t('error_title'), t('camera_capture_error'));
    }
  };

  // 解析実行
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    // 初期化
    analysisDoneRef.current = false;
    navigatedRef.current = false;
    adWillShowRef.current = false;
    setPostAdWaiting(false);

    // 無料回数チェック
    const todayStr = new Date().toLocaleDateString();
    const usageDate = await AsyncStorage.getItem('usageDate');
    let count = parseInt((await AsyncStorage.getItem('usageCount')) || '0');
    if (usageDate !== todayStr) {
      count = 0;
      await AsyncStorage.setItem('usageDate', todayStr);
      await AsyncStorage.setItem('usageCount', '0');
    }
    if (!isPremium && count >= FREE_LIMIT) {
      setError(t('analyze_limit_error'));
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // 60秒 watchdog
    if (analyzeWatchdogRef.current) clearTimeout(analyzeWatchdogRef.current);
    analyzeWatchdogRef.current = setTimeout(() => {
      console.log('[WATCHDOG] analyze timeout -> stop spinners');
      setIsAnalyzing(false);
      setPostAdWaiting(false);
    }, 60000);

    // 解析（非同期）
    (async () => {
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
        formData.append('use_chatgpt', isPremium ? 'true' : 'false'); // 明示
        formData.append('language', currentLang);

        console.log('[API] POST', `${API_BASE_URL}/api/analyze`);

        const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });

        console.log('[ANALYZE RESPONSE]', JSON.stringify(response.data, null, 2));

        if (response?.data?.success && response.data.result) {
          const result = response.data.result;
          setAnalysisResult(result);
          resultRef.current = result;
          setCurrentStep(3);
          analysisDoneRef.current = true;
          Toast.show({ type: 'success', text1: t('analyze_done'), text2: t('check_result') });

          // 広告を出さない場合は即遷移
          if (!adWillShowRef.current) {
            if (!navigatedRef.current) {
              navigatedRef.current = true;
              console.log('[NAV] go Result (no ad flow)');
              navigation.navigate('Result', { analysisResult: result });
            }
          } else {
            // 広告フロー中 → CLOSEDで遷移、ここでは待機表示にしておく
            setPostAdWaiting(true);
          }

          // 万が一の保険（0.5秒後に未遷移なら遷移）
          setTimeout(() => {
            if (!navigatedRef.current) {
              navigatedRef.current = true;
              console.log('[SAFEGUARD] navigate fallback');
              navigation.navigate('Result', { analysisResult: result });
            }
          }, 500);

          // 無料回数インクリメント
          if (!isPremium) {
            await AsyncStorage.setItem('usageCount', String(count + 1));
            setUsageCount(count + 1);
          }
        } else {
          console.log('[ANALYZE] invalid format', response?.data);
          setError(t('invalid_result_format'));
        }
      } catch (err) {
        console.error('解析エラー:', err);
        setError(t('analyze_error'));
        Toast.show({
          type: 'error',
          text1: t('analyze_error_title'),
          text2: t('analyze_error_retry'),
        });
      } finally {
        if (analyzeWatchdogRef.current) {
          clearTimeout(analyzeWatchdogRef.current);
          analyzeWatchdogRef.current = null;
        }
        setIsAnalyzing(false);
        // 広告を出さないなら待機も下ろす（広告ありはCLOSEDで下ろす）
        if (!adWillShowRef.current) {
          setPostAdWaiting(false);
        }
        console.log('[ANALYZE] setIsAnalyzing(false)');
      }
    })();

    // 同時にインタースティシャル（無料＆1日1回）
    try {
      if (!isPremium && adLoaded) {
        const today = new Date().toISOString().slice(0, 10);
        const shownDate = await AsyncStorage.getItem(INTERSTITIAL_SHOWN_KEY);
        if (shownDate !== today) {
          adWillShowRef.current = true;
          console.log('[AD] show interstitial');
          await interstitialRef.current.show();
          await AsyncStorage.setItem(INTERSTITIAL_SHOWN_KEY, today);
        } else {
          console.log('[AD] already shown today. skipping ad.');
        }
      } else {
        console.log('[AD] not shown (isPremium or not loaded)');
      }
    } catch (e) {
      console.log('Interstitial show failed', e);
      adWillShowRef.current = false; // 失敗したら即遷移側で処理される
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCurrentStep(1);
    setError(null);
    setUserConcerns('');
  };

  const shootingGuideImages = [require('../../assets/images/camera_guide.png')];
  const isGradient = isPremium && skinKey === 'gradient-blue';

  const Content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={[styles.title, skinStyle.title]}>{t('home_title')}</Text>
        <View style={styles.subtitleRow}>
          <LanguageSwitcher />
          <IconButton
            icon="help-circle-outline"
            size={22}
            onPress={() => navigation.navigate('FAQ')}
            style={styles.faqIcon}
            iconColor="#1976d2"
            accessibilityLabel={t('faq')}
          />
        </View>
        {!isPremium && (
          <Text style={[{ color: '#e53935', marginTop: 8, fontSize: 15 }, skinStyle.info]}>
            {t('home_free_remaining')}
            {Math.max(0, FREE_LIMIT - usageCount)} / {FREE_LIMIT}
          </Text>
        )}
      </View>

      {(currentStep === 1 || (currentStep === 2 && !selectedFile)) && (
        <Card style={[styles.card, skinStyle.card]}>
          <Card.Content>
            {isSelecting ? (
              <View style={{ alignItems: 'center', margin: 32 }}>
                <ActivityIndicator animating={true} size="large" color="#1976d2" />
                <Text style={{ marginTop: 16 }}>{t('video_preparing') || '動画を準備しています...'}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.cardTitle, skinStyle.cardTitle]}>{t('home_select_video')}</Text>
                <Text style={[styles.cardDescription, skinStyle.cardDescription]}>
                  {t('home_select_video_desc')}
                </Text>
                {isPremium && (
                  <TextInput
                    label={t('home_input_concern_label')}
                    value={userConcerns}
                    onChangeText={setUserConcerns}
                    placeholder={t('home_input_concern_placeholder')}
                    style={[{ marginTop: 12, backgroundColor: '#fff' }, skinStyle.textInput]}
                    multiline
                  />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                  <Switch value={isPremium} onValueChange={setIsPremium} />
                  <Text style={{ marginLeft: 8 }}>
                    {isPremium ? t('home_premium_label') : t('home_free_label')}
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
                    {t('home_guide')}
                  </Button>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleImageLibraryPicker}
                    style={styles.button}
                    icon="file-video"
                  >
                    {t('home_select_from_gallery')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleCameraCapture}
                    style={styles.button}
                    icon="camera"
                  >
                    {t('home_take_photo')}
                  </Button>
                </View>
                <Text style={styles.note}>{t('home_note')}</Text>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {currentStep === 2 && selectedFile && (
        <Card style={[styles.card, skinStyle.card]}>
          <Card.Content>
            {isAnalyzing ? (
              <View style={{ alignItems: 'center', margin: 32 }}>
                <ActivityIndicator animating={true} size="large" color="#1976d2" />
                <Text style={{ marginTop: 16 }}>{t('analyzing') || 'AIで解析中...'}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.cardTitle, skinStyle.cardTitle]}>{t('home_ready')}</Text>
                <Text style={[styles.cardDescription, skinStyle.cardDescription]}>
                  {t('home_selected_file')} {selectedFile?.name}
                </Text>
                {isPremium && (
                  <TextInput
                    label={t('home_input_concern_label2')}
                    value={userConcerns}
                    onChangeText={setUserConcerns}
                    placeholder={t('home_input_concern_placeholder')}
                    style={[{ marginTop: 12, backgroundColor: '#fff' }, skinStyle.textInput]}
                    multiline
                  />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }}>
                  <Switch value={isPremium} onValueChange={setIsPremium} />
                  <Text style={{ marginLeft: 8 }}>
                    {isPremium ? t('home_premium_label') : t('home_free_label')}
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button mode="contained" onPress={handleAnalyze} style={styles.button} icon="play">
                    {t('home_start_analysis')}
                  </Button>
                  <Button mode="outlined" onPress={handleReset} style={styles.button} icon="refresh">
                    {t('home_reset')}
                  </Button>
                </View>
              </>
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

  const GuideModal = (
    <ImageViewing
      images={shootingGuideImages}
      imageIndex={0}
      visible={showShootingGuide}
      onRequestClose={() => setShowShootingGuide(false)}
      HeaderComponent={({ onRequestClose }) => (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('home_guide')}</Text>
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
          <Text style={styles.modalFooterText}>{t('home_guide_footer')}</Text>
        </View>
      )}
    />
  );

  if (isPremium && skinKey === 'gradient-blue') {
    return (
      <AnimatedGradientBackground>
        <SafeAreaView style={[styles.container, skinStyle.background]}>
          {Content}
          {GuideModal}
          {postAdWaiting && (
            <View style={styles.postAdOverlay}>
              <ActivityIndicator animating={true} size="large" />
              <Text style={{ marginTop: 12 }}>{t('analyzing') || 'AIで解析中…'}</Text>
            </View>
          )}
          {!isPremium && (
            <View style={styles.bannerFooter}>
              <BannerAd
                unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-3940256099942544/6300978111'}
                size={BannerAdSize.FULL_BANNER}
                onAdLoaded={() => console.log('Ad loaded')}
                onAdFailedToLoad={(e) => console.log('Ad error', e)}
              />
            </View>
          )}
        </SafeAreaView>
      </AnimatedGradientBackground>
    );
  }

  return (
    <SafeAreaView style={[styles.container, skinStyle.background]}>
      {Content}
      {GuideModal}
      {postAdWaiting && (
        <View style={styles.postAdOverlay}>
          <ActivityIndicator animating={true} size="large" />
          <Text style={{ marginTop: 12 }}>{t('analyzing') || 'AIで解析中…'}</Text>
        </View>
      )}
      {!isPremium && (
        <View style={styles.bannerFooter}>
          <BannerAd
            unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-3940256099942544/6300978111'}
            size={BannerAdSize.FULL_BANNER}
            onAdLoaded={() => console.log('Ad loaded')}
            onAdFailedToLoad={(e) => console.log('Ad error', e)}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 90 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginRight: 2 },
  faqIcon: {
    marginLeft: 2,
    marginRight: -10,
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

  postAdOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },

  bannerFooter: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
});

export default HomeScreen;