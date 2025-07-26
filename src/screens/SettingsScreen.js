import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, Switch, Platform,
} from 'react-native';
import { Card, Button, List, Divider, IconButton, RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';
import apiService from '../services/apiService';
import { useSkin } from '../SkinContext';

const SKIN_OPTIONS_FREE = [
  { label: 'シンプル', value: 'classic' },
  { label: 'ポップ', value: 'genz' },
];
const SKIN_OPTIONS_PREMIUM = [
  ...SKIN_OPTIONS_FREE,
  { label: 'アース', value: 'dark' },
  { label: 'ミント', value: 'mint' },
  { label: 'レトロ', value: 'retro' },
];

const SettingsScreen = ({ navigation }) => {
  const { skinKey, setSkinKey, isPremium, setIsPremium } = useSkin();
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [appInfo, setAppInfo] = useState({});
  const [skinOptionList, setSkinOptionList] = useState(SKIN_OPTIONS_FREE);

  useEffect(() => {
    loadSettings();
    checkServerStatus();
    loadAppInfo();
    setSkinOptionList(isPremium ? SKIN_OPTIONS_PREMIUM : SKIN_OPTIONS_FREE);
  }, [isPremium]);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('enable_notifications');
      if (savedNotifications) setEnableNotifications(JSON.parse(savedNotifications));
      const savedSkin = await AsyncStorage.getItem('selectedSkin');
      if (savedSkin) setSkinKey(savedSkin);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('enable_notifications', JSON.stringify(enableNotifications));
      await AsyncStorage.setItem('selectedSkin', skinKey);
      Toast.show({
        type: 'success',
        text1: '設定を保存しました',
        text2: '変更が適用されました',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '設定の保存に失敗しました',
        text2: 'もう一度お試しください',
      });
    }
  };

  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const isHealthy = await apiService.checkHealth();
      setServerStatus(isHealthy ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  };

  const loadAppInfo = async () => {
    try {
      setAppInfo({
        appName: Application.applicationName || 'Tennis Serve Analyzer',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        buildVersion: Application.nativeBuildVersion || '1',
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
        osVersion: Device.osVersion || 'Unknown',
      });
    } catch {}
  };

  const resetSettings = () => {
    Alert.alert(
      '設定のリセット',
      'すべての設定を初期値に戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['enable_notifications', 'selectedSkin', 'isPremium']);
              setEnableNotifications(true);
              setSkinKey('classic');
              setIsPremium(false);
              Toast.show({
                type: 'success',
                text1: '設定をリセットしました',
                text2: '初期値に戻りました',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'リセットに失敗しました',
                text2: 'もう一度お試しください',
              });
            }
          },
        },
      ]
    );
  };

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'online': return '#4caf50';
      case 'offline': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'online': return 'オンライン';
      case 'offline': return 'オフライン';
      default: return '確認中...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* サーバー状態 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.serverStatus}>
              <Text style={styles.cardTitle}>サーバー状態</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getServerStatusColor() }]} />
                <Text style={styles.statusText}>{getServerStatusText()}</Text>
                <IconButton icon="refresh" size={20} onPress={checkServerStatus} />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* プレミアムモード切替 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>モード切替</Text>
            <Divider style={styles.divider} />
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>
                {isPremium ? 'プレミアムモード（全機能解放）' : '無料モード'}
              </Text>
              <Switch
                value={isPremium}
                onValueChange={setIsPremium}
                trackColor={{ false: '#767577', true: '#ffd600' }}
                thumbColor={isPremium ? '#ffd600' : '#f4f3f4'}
              />
            </View>
            {!isPremium && (
              <Text style={{ color: '#888', marginTop: 8, fontSize: 13 }}>
                プレミアムで全スキンや詳細アドバイスが解放されます
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* スキン切替 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              スキン選択（{isPremium ? 'プレミアム' : '無料'}枠）
            </Text>
            <Divider style={styles.divider} />
            <RadioButton.Group
              onValueChange={value => setSkinKey(value)}
              value={skinKey}
            >
              {skinOptionList.map(option => (
                <View key={option.value} style={styles.skinRadioItem}>
                  <RadioButton value={option.value} />
                  <Text style={styles.skinLabel}>{option.label}</Text>
                </View>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* アプリ設定 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>アプリ設定</Text>
            <Divider style={styles.divider} />
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>通知を有効にする</Text>
              <Switch
                value={enableNotifications}
                onValueChange={setEnableNotifications}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enableNotifications ? '#1976d2' : '#f4f3f4'}
              />
            </View>
          </Card.Content>
        </Card>

        {/* アプリ情報 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>アプリ情報</Text>
            <Divider style={styles.divider} />
            <List.Item
              title="アプリ名"
              description={appInfo.appName}
              left={props => <List.Icon {...props} icon="application" />}
            />
            <List.Item
              title="バージョン"
              description={`${appInfo.appVersion} (${appInfo.buildVersion})`}
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="プラットフォーム"
              description={`${appInfo.platform} ${appInfo.osVersion}`}
              left={props => <List.Icon {...props} icon="cellphone" />}
            />
            <List.Item
              title="デバイス"
              description={appInfo.deviceName}
              left={props => <List.Icon {...props} icon="devices" />}
            />
          </Card.Content>
        </Card>

        {/* アクションボタン */}
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={saveSettings} style={styles.button} icon="content-save">
            設定を保存
          </Button>
          <Button mode="outlined" onPress={resetSettings} style={styles.button} icon="restore">
            設定をリセット
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
  card: { marginBottom: 16, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', marginBottom: 8 },
  divider: { marginBottom: 16 },
  serverStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '500' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: 16, flex: 1 },
  buttonContainer: { marginTop: 16, gap: 12 },
  button: { marginVertical: 4 },
  skinRadioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  skinLabel: { fontSize: 16, marginLeft: 4 },
});

export default SettingsScreen;
