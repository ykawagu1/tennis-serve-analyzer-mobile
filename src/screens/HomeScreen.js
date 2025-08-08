import React, { useState, useCallback } from 'react';
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

const API_BASE_URL = 'http://192.168.10.117:5001';
const FREE_LIMIT = 3;

const HomeScreen = ({ navigation }) => {
  const { skin, skinStyle, skinKey, isPremium, setIsPremium } = useSkin();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false); // ← 動画選択中フラグ
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userConcerns, setUserConcerns] = useState('');
  const [showShootingGuide, setShowShootingGuide] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/tossup2.png')}
              style={{ width: 32, height: 32, resizeMode: 'contain', marginRight: 8 }}
            />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#000',
              letterSpacing: 1,
            }}>
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
        setError(null);
        setCurrentStep(1);
        setUserConcerns('');
        setIsSelecting(false);
        setIsAnalyzing(false);
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

  // フォトライブラリから動画選択
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

  // カメラで撮影
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

    const today = new Date().toLocaleDateString();
    const usageDate = await AsyncStorage.getItem('usageDate');
    let count = parseInt(await AsyncStorage.getItem('usageCount') || '0');
    if (usageDate !== today) {
      count = 0;
      await AsyncStorage.setItem('usageDate', today);
      await AsyncStorage.setItem('usageCount', '0');
    }
    if (!isPremium && count >= FREE_LIMIT) {
      setError(t('analyze_limit_error'));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
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
      formData.append('language', currentLang);
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success && response.data.result) {
        setAnalysisResult(response.data.result);
        setCurrentStep(3);
        Toast.show({ type: 'success', text1: t('analyze_done'), text2: t('check_result') });
        navigation.navigate('Result', {
          analysisResult: response.data.result,
        });
        if (!isPremium) {
          await AsyncStorage.setItem('usageCount', (count + 1).toString());
          setUsageCount(count + 1);
        }
      } else {
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
      setIsAnalyzing(false);
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
            {/* くるくるマーク：動画選択中 */}
            {isSelecting && (
              <View style={{ alignItems: 'center', margin: 32 }}>
                <ActivityIndicator animating={true} size="large" color="#1976d2" />
                <Text style={{ marginTop: 16 }}>{t('video_preparing') || '動画を準備しています...'}</Text>
              </View>
            )}

            {/* 通常UI（くるくるが出てない時だけ） */}
            {!isSelecting && (
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
                    {isPremium
                      ? t('home_premium_label')
                      : t('home_free_label')}
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
                <Text style={styles.note}>
                  {t('home_note')}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {currentStep === 2 && selectedFile && (
        <Card style={[styles.card, skinStyle.card]}>
          <Card.Content>
            {/* くるくるマーク：解析中 */}
            {isAnalyzing ? (
              <View style={{ alignItems: 'center', margin: 32 }}>
                <ActivityIndicator animating={true} size="large" color="#1976d2" />
                <Text style={{ marginTop: 16 }}>{t('analyzing') || 'AIで解析中...'}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.cardTitle, skinStyle.cardTitle]}>{t('home_ready')}</Text>
                <Text style={[styles.cardDescription, skinStyle.cardDescription]}>
                  {t('home_selected_file')} {selectedFile.name}
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
                    {isPremium
                      ? t('home_premium_label')
                      : t('home_free_label')}
                  </Text>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={handleAnalyze}
                    style={styles.button}
                    icon="play"
                  >
                    {t('home_start_analysis')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleReset}
                    style={styles.button}
                    icon="refresh"
                  >
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
          <Text style={styles.modalFooterText}>
            {t('home_guide_footer')}
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
  progressContainer: { alignItems: 'center' },
  progressText: { fontSize: 16, marginBottom: 8 },
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