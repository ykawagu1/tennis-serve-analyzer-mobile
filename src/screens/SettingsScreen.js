import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, Switch, Platform,
} from 'react-native';
import { Card, Button, List, Divider, IconButton, RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next'; // ★ここを追加
import apiService from '../services/apiService';
import { useSkin, SKINS } from '../SkinContext';

const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation(); // ★ここを追加
  const { skinKey, setSkinKey, isPremium, setIsPremium } = useSkin();
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [appInfo, setAppInfo] = useState({});

  useEffect(() => {
    loadSettings();
    checkServerStatus();
    loadAppInfo();
  }, [isPremium]);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('enable_notifications');
      if (savedNotifications) setEnableNotifications(JSON.parse(savedNotifications));
      const savedSkin = await AsyncStorage.getItem('selectedSkin');
      if (savedSkin) setSkinKey(savedSkin);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('enable_notifications', JSON.stringify(enableNotifications));
      await AsyncStorage.setItem('selectedSkin', skinKey);
      Toast.show({
        type: 'success',
        text1: t('settings_saved'),
        text2: t('settings_applied'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('settings_save_failed'),
        text2: t('settings_try_again'),
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
      t('settings_reset_title'),
      t('settings_reset_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['enable_notifications', 'selectedSkin', 'isPremium']);
              setEnableNotifications(true);
              setSkinKey('classic');
              setIsPremium(false);
              Toast.show({
                type: 'success',
                text1: t('settings_reset_done'),
                text2: t('settings_reset_restored'),
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: t('settings_reset_failed'),
                text2: t('settings_try_again'),
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
      case 'online': return t('settings_server_online');
      case 'offline': return t('settings_server_offline');
      default: return t('settings_server_checking');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* サーバー状態 */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.serverStatus}>
              <Text style={styles.cardTitle}>{t('settings_server_status')}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getServerStatusColor() }]} />
                <Text style={styles.statusText}>{getServerStatusText()}</Text>
                <IconButton icon="refresh" size={20} onPress={checkServerStatus} />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* プレミアム切替 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('settings_mode_switch')}</Text>
            <Divider style={styles.divider} />
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>
                {isPremium ? t('settings_premium_mode') : t('settings_free_mode')}
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
                {t('settings_premium_hint')}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* スキン切替 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              {t('settings_skin_select', { mode: isPremium ? t('settings_premium') : t('settings_free') })}
            </Text>
            <Divider style={styles.divider} />
            {SKINS.map(option => {
              const disabled = option.premiumOnly && !isPremium;
              const isSelected = skinKey === option.key;
              return (
                <View key={option.key} style={styles.skinRadioItem}>
                  <RadioButton
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={() => {
                      if (disabled) {
                        Toast.show({
                          type: 'info',
                          text1: t('settings_skin_premium_only'),
                          text2: t('settings_skin_premium_info'),
                        });
                      } else {
                        setSkinKey(option.key);
                      }
                    }}
                    uncheckedColor={disabled ? '#ccc' : undefined}
                    color={disabled ? '#ccc' : '#1976d2'}
                  />
                  <Text
                    style={[
                      styles.skinLabel,
                      disabled && { color: '#aaa' },
                    ]}
                  >
                    {t(option.nameKey)}
                    {option.premiumOnly && (
                      <Text style={{ color: disabled ? '#bbb' : '#e53935', fontSize: 13 }}>
                        {t('settings_premium_only')}
                      </Text>
                    )}
                  </Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* 通知設定 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('settings_app')}</Text>
            <Divider style={styles.divider} />
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>{t('settings_enable_notifications')}</Text>
              <Switch
                value={enableNotifications}
                onValueChange={setEnableNotifications}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={enableNotifications ? '#1976d2' : '#f4f3f4'}
              />
            </View>
          </Card.Content>
        </Card>

        {/* FAQ案内 */}
        <View style={styles.faqContainer}>
          <Button
            mode="outlined"
            icon="help-circle-outline"
            onPress={() => navigation.navigate('FAQ')}
            style={styles.faqButton}
            labelStyle={{ fontSize: 16 }}
            contentStyle={{ flexDirection: 'row-reverse' }}
          >
            {t('settings_faq_btn')}
          </Button>
          <View style={{ height: 12 }} />
          <Text style={styles.faqNote}>
            {t('settings_faq_note')}
          </Text>
        </View>

        {/* アプリ情報 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('settings_app_info')}</Text>
            <Divider style={styles.divider} />
            <List.Item
              title={t('settings_app_name')}
              description={appInfo.appName}
              left={props => <List.Icon {...props} icon="application" />}
            />
            <List.Item
              title={t('settings_app_version')}
              description={`${appInfo.appVersion} (${appInfo.buildVersion})`}
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title={t('settings_app_platform')}
              description={`${appInfo.platform} ${appInfo.osVersion}`}
              left={props => <List.Icon {...props} icon="cellphone" />}
            />
            <List.Item
              title={t('settings_app_device')}
              description={appInfo.deviceName}
              left={props => <List.Icon {...props} icon="devices" />}
            />
          </Card.Content>
        </Card>

        {/* アクション */}
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={saveSettings} style={styles.button} icon="content-save">
            {t('settings_save_btn')}
          </Button>
          <Button mode="outlined" onPress={resetSettings} style={styles.button} icon="restore">
            {t('settings_reset_btn')}
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
  faqContainer: { marginVertical: 16, alignItems: 'center' },
  faqButton: { borderColor: '#1976d2' },
  faqNote: { fontSize: 13, color: '#555', textAlign: 'center', marginTop: 4 },
});

export default SettingsScreen;