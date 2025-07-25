import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';

const PermissionManager = ({ children, onPermissionsReady }) => {
  const [permissions, setPermissions] = useState({
    camera: null,
    mediaLibrary: null,
    notifications: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  useEffect(() => {
    const granted = Object.values(permissions).every(
      permission => permission === 'granted' || permission === 'not-required'
    );
    setAllPermissionsGranted(granted);
    if (granted && onPermissionsReady) {
      onPermissionsReady();
    }
  }, [permissions, onPermissionsReady]);

  // すべての権限をチェック
  const checkAllPermissions = async () => {
    setIsLoading(true);
    try {
      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      const notificationStatus = await Notifications.getPermissionsAsync();

      setPermissions({
        camera: cameraStatus.status,
        mediaLibrary: mediaLibraryStatus.status,
        notifications: notificationStatus.status,
      });
    } catch (error) {
      console.error('権限チェックエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // カメラ権限の要求
  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setPermissions(prev => ({ ...prev, camera: status }));
      
      if (status === 'denied') {
        Alert.alert(
          'カメラ権限が必要です',
          'テニスサーブの動画を撮影するためにカメラへのアクセスが必要です。設定からアプリの権限を有効にしてください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('カメラ権限要求エラー:', error);
    }
  };

  // メディアライブラリ権限の要求
  const requestMediaLibraryPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissions(prev => ({ ...prev, mediaLibrary: status }));
      
      if (status === 'denied') {
        Alert.alert(
          'メディアライブラリ権限が必要です',
          '動画ファイルにアクセスするためにメディアライブラリへのアクセスが必要です。設定からアプリの権限を有効にしてください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('メディアライブラリ権限要求エラー:', error);
    }
  };

  // 通知権限の要求
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissions(prev => ({ ...prev, notifications: status }));
      
      if (status === 'denied') {
        Alert.alert(
          '通知権限について',
          '解析完了の通知を受け取るために通知権限を有効にすることをお勧めします。後で設定から変更できます。',
          [
            { text: 'スキップ', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('通知権限要求エラー:', error);
    }
  };

  // すべての権限を要求
  const requestAllPermissions = async () => {
    await requestCameraPermission();
    await requestMediaLibraryPermission();
    await requestNotificationPermission();
  };

  // 権限ステータスの表示テキスト
  const getPermissionStatusText = (status) => {
    switch (status) {
      case 'granted': return '許可済み';
      case 'denied': return '拒否';
      case 'undetermined': return '未設定';
      default: return '不明';
    }
  };

  // 権限ステータスの色
  const getPermissionStatusColor = (status) => {
    switch (status) {
      case 'granted': return '#4caf50';
      case 'denied': return '#f44336';
      case 'undetermined': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>権限を確認中...</Text>
      </View>
    );
  }

  if (allPermissionsGranted) {
    return children;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>アプリの権限設定</Text>
          <Text style={styles.description}>
            Tennis Serve Analyzerを使用するために、以下の権限が必要です。
          </Text>

          {/* カメラ権限 */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>📷 カメラ</Text>
              <Text style={styles.permissionDescription}>
                テニスサーブの動画撮影に使用
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text style={[
                styles.statusText,
                { color: getPermissionStatusColor(permissions.camera) }
              ]}>
                {getPermissionStatusText(permissions.camera)}
              </Text>
              {permissions.camera !== 'granted' && (
                <Button
                  mode="outlined"
                  onPress={requestCameraPermission}
                  compact
                  style={styles.permissionButton}
                >
                  許可
                </Button>
              )}
            </View>
          </View>

          {/* メディアライブラリ権限 */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>📁 メディアライブラリ</Text>
              <Text style={styles.permissionDescription}>
                動画ファイルの選択に使用
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text style={[
                styles.statusText,
                { color: getPermissionStatusColor(permissions.mediaLibrary) }
              ]}>
                {getPermissionStatusText(permissions.mediaLibrary)}
              </Text>
              {permissions.mediaLibrary !== 'granted' && (
                <Button
                  mode="outlined"
                  onPress={requestMediaLibraryPermission}
                  compact
                  style={styles.permissionButton}
                >
                  許可
                </Button>
              )}
            </View>
          </View>

          {/* 通知権限 */}
          <View style={styles.permissionItem}>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionTitle}>🔔 通知</Text>
              <Text style={styles.permissionDescription}>
                解析完了の通知に使用（オプション）
              </Text>
            </View>
            <View style={styles.permissionStatus}>
              <Text style={[
                styles.statusText,
                { color: getPermissionStatusColor(permissions.notifications) }
              ]}>
                {getPermissionStatusText(permissions.notifications)}
              </Text>
              {permissions.notifications !== 'granted' && (
                <Button
                  mode="outlined"
                  onPress={requestNotificationPermission}
                  compact
                  style={styles.permissionButton}
                >
                  許可
                </Button>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={requestAllPermissions}
              style={styles.button}
              icon="check-all"
            >
              すべての権限を許可
            </Button>
            
            <Button
              mode="outlined"
              onPress={checkAllPermissions}
              style={styles.button}
              icon="refresh"
            >
              権限を再確認
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                mode="text"
                onPress={() => Linking.openSettings()}
                style={styles.button}
                icon="cog"
              >
                設定アプリを開く
              </Button>
            )}
          </View>

          <Text style={styles.note}>
            ※ 一部の権限が拒否されていても、基本的な機能は使用できます。
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#666',
  },
  permissionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionButton: {
    minWidth: 60,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 8,
  },
  button: {
    marginVertical: 4,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default PermissionManager;

