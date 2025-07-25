import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  List,
  Divider,
  IconButton,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';

import apiService from '../services/apiService';

const SettingsScreen = ({ navigation }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [useChatGPT, setUseChatGPT] = useState(false);
  const [autoSaveResults, setAutoSaveResults] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    loadSettings();
    checkServerStatus();
    loadAppInfo();
  }, []);

  // 設定の読み込み
  const loadSettings = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem('openai_api_key');
      const savedUseChatGPT = await AsyncStorage.getItem('use_chatgpt');
      const savedAutoSave = await AsyncStorage.getItem('auto_save_results');
      const savedNotifications = await AsyncStorage.getItem('enable_notifications');

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedUseChatGPT) setUseChatGPT(JSON.parse(savedUseChatGPT));
      if (savedAutoSave) setAutoSaveResults(JSON.parse(savedAutoSave));
      if (savedNotifications) setEnableNotifications(JSON.parse(savedNotifications));
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  };

  // 設定の保存
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      await AsyncStorage.setItem('use_chatgpt', JSON.stringify(useChatGPT));
      await AsyncStorage.setItem('auto_save_results', JSON.stringify(autoSaveResults));
      await AsyncStorage.setItem('enable_notifications', JSON.stringify(enableNotifications));

      Toast.show({
        type: 'success',
        text1: '設定を保存しました',
        text2: '変更が適用されました',
      });
    } catch (error) {
      console.error('設定の保存エラー:', error);
      Toast.show({
        type: 'error',
        text1: '設定の保存に失敗しました',
        text2: 'もう一度お試しください',
      });
    }
  };

  // サーバー状態のチェック
  const checkServerStatus = async () => {
    setServerStatus('checking');
    try {
      const isHealthy = await apiService.checkHealth();
      setServerStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // アプリ情報の読み込み
  const loadAppInfo = async () => {
    try {
      const info = {
        appName: Application.applicationName || 'Tennis Serve Analyzer',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        buildVersion: Application.nativeBuildVersion || '1',
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
        osVersion: Device.osVersion || 'Unknown',
      };
      setAppInfo(info);
    } catch (error) {
      console.error('アプリ情報の取得エラー:', error);
    }
  };

  // APIキーの検証
  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('エラー', 'APIキーを入力してください');
      return;
    }

    try {
      const isValid = await apiService.validateApiKey(apiKey);
      if (isValid) {
        Alert.alert('成功', 'APIキーは有効です');
        setUseChatGPT(true);
      } else {
        Alert.alert('エラー', 'APIキーが無効です');
        setUseChatGPT(false);
      }
    } catch (error) {
      Alert.alert('エラー', 'APIキーの検証に失敗しました');
    }
  };

  // 設定のリセット
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
              await AsyncStorage.multiRemove([
                'openai_api_key',
                'use_chatgpt',
                'auto_save_results',
                'enable_notifications',
              ]);
              
              setApiKey('');
              setUseChatGPT(false);
              setAutoSaveResults(true);
              setEnableNotifications(true);
              
              Toast.show({
                type: 'success',
                text1: '設定をリセットしました',
                text2: '初期値に戻りました',
              });
            } catch (error) {
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
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={checkServerStatus}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* AI設定 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>AI設定</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>ChatGPT詳細解析を使用</Text>
              <Switch
                value={useChatGPT}
                onValueChange={setUseChatGPT}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={useChatGPT ? '#1976d2' : '#f4f3f4'}
              />
            </View>

            {useChatGPT && (
              <>
                <TextInput
                  label="OpenAI APIキー"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry={!showApiKey}
                  right={
                    <TextInput.Icon
                      icon={showApiKey ? 'eye-off' : 'eye'}
                      onPress={() => setShowApiKey(!showApiKey)}
                    />
                  }
                  style={styles.textInput}
                  placeholder="sk-..."
                />
                
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={validateApiKey}
                    style={styles.smallButton}
                    compact
                  >
                    検証
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* アプリ設定 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>アプリ設定</Text>
            <Divider style={styles.divider} />
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>解析結果を自動保存</Text>
              <Switch
                value={autoSaveResults}
                onValueChange={setAutoSaveResults}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoSaveResults ? '#1976d2' : '#f4f3f4'}
              />
            </View>

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
          <Button
            mode="contained"
            onPress={saveSettings}
            style={styles.button}
            icon="content-save"
          >
            設定を保存
          </Button>
          
          <Button
            mode="outlined"
            onPress={resetSettings}
            style={styles.button}
            icon="restore"
          >
            設定をリセット
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  serverStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  textInput: {
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  smallButton: {
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
});

export default SettingsScreen;

