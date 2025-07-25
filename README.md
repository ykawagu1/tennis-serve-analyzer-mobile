# Tennis Serve Analyzer - React Native App

AI を活用したテニスサーブ動作解析アプリのReact Native版です。

## 概要

このアプリは、テニスプレイヤーのサーブ動作を動画で解析し、AI による詳細なフィードバックとアドバイスを提供します。iOS・Android両方のプラットフォームに対応しています。

## 主な機能

### 📱 基本機能
- **動画ファイル選択**: デバイスから動画ファイルを選択
- **カメラ撮影**: アプリ内でテニスサーブの動画を直接撮影
- **AI解析**: 動作解析とスコア評価
- **詳細レポート**: フェーズ別評価と改善アドバイス

### 🔧 React Native固有機能
- **権限管理**: カメラ・メディアライブラリ・通知権限の適切な管理
- **設定画面**: APIキー管理、アプリ設定の永続化
- **ネイティブナビゲーション**: タブ・スタックナビゲーション
- **プラットフォーム最適化**: iOS・Android固有の最適化

### 🎯 技術的特徴
- **Expo SDK**: 最新のExpo SDK 53を使用
- **React Navigation**: v7を使用したモダンなナビゲーション
- **React Native Paper**: Material Designベースの統一されたUI
- **AsyncStorage**: 設定の永続化
- **権限管理**: 段階的で透明性の高い権限要求

## 技術スタック

### フレームワーク・ライブラリ
- **React Native**: 0.79.5
- **Expo**: 53.0.20
- **React**: 19.0.0
- **React Navigation**: 7.x

### UI・UX
- **React Native Paper**: 5.14.5 (Material Design)
- **React Native Elements**: 3.4.3
- **React Native Vector Icons**: 10.2.0
- **React Native Toast Message**: 2.3.3

### ネイティブ機能
- **expo-image-picker**: カメラ・フォトライブラリアクセス
- **expo-document-picker**: ファイル選択
- **expo-media-library**: メディアファイル管理
- **expo-notifications**: プッシュ通知
- **expo-device**: デバイス情報取得
- **expo-application**: アプリケーション情報

### データ管理
- **AsyncStorage**: ローカルストレージ
- **axios**: HTTP通信

## プロジェクト構造

```
src/
├── components/
│   └── PermissionManager.js    # 権限管理コンポーネント
├── screens/
│   ├── HomeScreen.js           # メイン画面
│   ├── ResultScreen.js         # 解析結果表示画面
│   └── SettingsScreen.js       # 設定画面
├── services/
│   └── apiService.js           # API通信サービス
└── utils/
    └── fileUtils.js            # ファイル関連ユーティリティ
```

## セットアップ手順

### 前提条件
- Node.js 18以上
- npm または yarn
- Expo CLI
- iOS Simulator (iOS開発の場合)
- Android Studio & Android Emulator (Android開発の場合)

### インストール

1. **依存関係のインストール**
```bash
npm install
```

2. **Expo CLIのインストール (グローバル)**
```bash
npm install -g @expo/cli
```

### 開発環境での実行

1. **開発サーバーの起動**
```bash
npx expo start
```

2. **プラットフォーム別実行**
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web (開発・テスト用)
npx expo start --web
```

### 物理デバイスでのテスト

1. **Expo Goアプリをインストール**
   - iOS: App Store から「Expo Go」をダウンロード
   - Android: Google Play Store から「Expo Go」をダウンロード

2. **QRコードでアクセス**
   - `npx expo start` 実行後に表示されるQRコードをスキャン

## 設定

### APIキーの設定

1. アプリの設定画面を開く
2. 「ChatGPT詳細解析を使用」をオンにする
3. OpenAI APIキーを入力
4. 「検証」ボタンでAPIキーの有効性を確認
5. 「設定を保存」で保存

### バックエンドサーバーの設定

`src/services/apiService.js` でAPIベースURLを設定:

```javascript
const API_BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://your-production-api.com';
```

## ビルド・デプロイ

### 開発ビルド

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### プロダクションビルド

```bash
# EAS Build を使用
npx expo install @expo/cli
npx eas build --platform all
```

### アプリストア配布

```bash
# EAS Submit を使用
npx eas submit --platform all
```

## テスト

### 機能テスト

```bash
node test-functions.js
```

### 構文チェック

```bash
# 全ファイルの構文チェック
find src -name "*.js" -exec node -c {} \;
```

## 権限について

このアプリは以下の権限を使用します：

### iOS
- **NSCameraUsageDescription**: テニスサーブの動画撮影
- **NSPhotoLibraryUsageDescription**: 動画ファイルの選択
- **NSMicrophoneUsageDescription**: 動画撮影時の音声録音

### Android
- **CAMERA**: カメラアクセス
- **READ_EXTERNAL_STORAGE**: ファイル読み込み
- **WRITE_EXTERNAL_STORAGE**: ファイル保存
- **RECORD_AUDIO**: 音声録音
- **INTERNET**: ネットワーク通信
- **ACCESS_NETWORK_STATE**: ネットワーク状態確認

## トラブルシューティング

### よくある問題

1. **Metro bundler エラー**
```bash
npx expo start --clear
```

2. **依存関係の問題**
```bash
rm -rf node_modules
npm install
```

3. **iOS Simulator の問題**
```bash
npx expo start --ios --clear
```

4. **Android Emulator の問題**
```bash
npx expo start --android --clear
```

### 権限エラー

- アプリの設定画面から権限状態を確認
- デバイスの設定アプリで権限を手動で有効化
- アプリを再起動

## 開発者向け情報

### コードスタイル
- ES6+ JavaScript
- React Hooks パターン
- Functional Components
- StyleSheet による スタイリング

### 状態管理
- React useState/useEffect
- AsyncStorage による永続化
- Context API (必要に応じて)

### ナビゲーション構造
```
MainStackNavigator
├── MainTabNavigator
│   ├── HomeScreen (ホーム)
│   └── SettingsScreen (設定)
└── ResultScreen (解析結果)
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストや Issue の報告を歓迎します。

## サポート

問題や質問がある場合は、GitHub Issues でお知らせください。

---

**Tennis Serve Analyzer React Native App**  
Version 1.0.0  
Built with ❤️ using React Native & Expo

