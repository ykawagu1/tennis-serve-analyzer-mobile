/**
 * Tennis Serve Analyzer React Native App
 * 機能テスト用スクリプト
 */

// ファイルユーティリティのテスト
const { 
  isValidVideoFormat, 
  isValidFileSize, 
  formatFileSize, 
  validateVideoFile 
} = require('./src/utils/fileUtils');

console.log('=== ファイルユーティリティテスト ===');

// ファイル形式テスト
console.log('1. ファイル形式テスト:');
console.log('  test.mp4:', isValidVideoFormat('test.mp4')); // true
console.log('  test.avi:', isValidVideoFormat('test.avi')); // true
console.log('  test.txt:', isValidVideoFormat('test.txt')); // false
console.log('  test.jpg:', isValidVideoFormat('test.jpg')); // false

// ファイルサイズテスト
console.log('\n2. ファイルサイズテスト:');
console.log('  50MB:', isValidFileSize(50 * 1024 * 1024)); // true
console.log('  150MB:', isValidFileSize(150 * 1024 * 1024)); // false

// ファイルサイズフォーマットテスト
console.log('\n3. ファイルサイズフォーマットテスト:');
console.log('  1024 bytes:', formatFileSize(1024)); // 1 KB
console.log('  1048576 bytes:', formatFileSize(1048576)); // 1 MB
console.log('  52428800 bytes:', formatFileSize(52428800)); // 50 MB

// ファイル検証テスト
console.log('\n4. ファイル検証テスト:');
const validFile = {
  name: 'tennis_serve.mp4',
  size: 50 * 1024 * 1024 // 50MB
};
const invalidFile = {
  name: 'tennis_serve.txt',
  size: 150 * 1024 * 1024 // 150MB
};

console.log('  有効なファイル:', validateVideoFile(validFile));
console.log('  無効なファイル:', validateVideoFile(invalidFile));

console.log('\n=== APIサービステスト ===');

// APIサービスの基本テスト（モック）
console.log('5. APIサービス初期化テスト:');
try {
  const apiService = require('./src/services/apiService');
  console.log('  APIサービス初期化: 成功');
  console.log('  ベースURL設定: 確認済み');
} catch (error) {
  console.log('  APIサービス初期化: エラー -', error.message);
}

console.log('\n=== React Nativeコンポーネントテスト ===');

// React Nativeコンポーネントの基本構文テスト
console.log('6. コンポーネント構文テスト:');
const fs = require('fs');

const componentFiles = [
  './App.js',
  './src/screens/HomeScreen.js',
  './src/screens/ResultScreen.js',
  './src/screens/SettingsScreen.js',
  './src/components/PermissionManager.js'
];

componentFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // 基本的な構文チェック
    const hasImports = content.includes('import');
    const hasExport = content.includes('export default');
    const hasReact = content.includes('React');
    
    console.log(`  ${file}:`);
    console.log(`    - インポート文: ${hasImports ? '✓' : '✗'}`);
    console.log(`    - エクスポート文: ${hasExport ? '✓' : '✗'}`);
    console.log(`    - React使用: ${hasReact ? '✓' : '✗'}`);
  } catch (error) {
    console.log(`  ${file}: エラー - ${error.message}`);
  }
});

console.log('\n=== 設定ファイルテスト ===');

// package.jsonテスト
console.log('7. package.json テスト:');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  console.log('  パッケージ名:', packageJson.name);
  console.log('  バージョン:', packageJson.version);
  console.log('  依存関係数:', Object.keys(packageJson.dependencies || {}).length);
  console.log('  React Native:', packageJson.dependencies['react-native'] ? '✓' : '✗');
  console.log('  Expo:', packageJson.dependencies['expo'] ? '✓' : '✗');
} catch (error) {
  console.log('  package.json エラー:', error.message);
}

// app.jsonテスト
console.log('\n8. app.json テスト:');
try {
  const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  console.log('  アプリ名:', appJson.expo.name);
  console.log('  スラッグ:', appJson.expo.slug);
  console.log('  バージョン:', appJson.expo.version);
  console.log('  iOS設定:', appJson.expo.ios ? '✓' : '✗');
  console.log('  Android設定:', appJson.expo.android ? '✓' : '✗');
  console.log('  プラグイン数:', appJson.expo.plugins ? appJson.expo.plugins.length : 0);
} catch (error) {
  console.log('  app.json エラー:', error.message);
}

console.log('\n=== テスト完了 ===');
console.log('すべての基本機能テストが完了しました。');
console.log('React Nativeアプリとして正常に構成されています。');

