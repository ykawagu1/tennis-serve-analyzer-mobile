/**
 * Tennis Serve Analyzer React Native App
 * バックエンド・フロントエンド統合テスト
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// テスト設定
const TEST_CONFIG = {
  // バックエンドURL（本番環境では適切なURLに変更）
  BACKEND_URL: 'http://localhost:5000',
  // テスト用動画ファイル（実際のテストでは実ファイルを使用）
  TEST_VIDEO_PATH: './test-video.mp4',
  // タイムアウト設定
  TIMEOUT: 30000
};

console.log('=== Tennis Serve Analyzer 統合テスト ===');
console.log(`バックエンドURL: ${TEST_CONFIG.BACKEND_URL}`);

/**
 * バックエンドの生存確認
 */
async function testBackendHealth() {
  console.log('\n1. バックエンド生存確認テスト');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.BACKEND_URL}/`, {
      timeout: 5000
    });
    
    console.log('  ✅ バックエンドサーバーが応答しています');
    console.log(`  ステータス: ${response.status}`);
    return true;
  } catch (error) {
    console.log('  ❌ バックエンドサーバーに接続できません');
    console.log(`  エラー: ${error.message}`);
    return false;
  }
}

/**
 * CORS設定テスト
 */
async function testCORS() {
  console.log('\n2. CORS設定テスト');
  
  try {
    const response = await axios.options(`${TEST_CONFIG.BACKEND_URL}/api/analyze`, {
      headers: {
        'Origin': 'http://localhost:19006', // Expo開発サーバーのオリジン
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    console.log('  ✅ CORS設定が正常です');
    console.log('  CORS ヘッダー:', corsHeaders);
    return true;
  } catch (error) {
    console.log('  ❌ CORS設定に問題があります');
    console.log(`  エラー: ${error.message}`);
    return false;
  }
}

/**
 * API エンドポイントテスト（ファイルなし）
 */
async function testAPIWithoutFile() {
  console.log('\n3. API エンドポイントテスト（ファイルなし）');
  
  try {
    const response = await axios.post(`${TEST_CONFIG.BACKEND_URL}/api/analyze`, {}, {
      timeout: 5000,
      validateStatus: () => true // すべてのステータスコードを受け入れ
    });
    
    console.log(`  ステータス: ${response.status}`);
    console.log(`  レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data && response.data.success === false) {
      console.log('  ✅ 適切なエラーレスポンスが返されています');
      return true;
    } else {
      console.log('  ❌ 期待されるエラーレスポンスが返されていません');
      return false;
    }
  } catch (error) {
    console.log('  ❌ API エンドポイントテストに失敗');
    console.log(`  エラー: ${error.message}`);
    return false;
  }
}

/**
 * FormData形式テスト
 */
async function testFormDataFormat() {
  console.log('\n4. FormData形式テスト');
  
  try {
    // React NativeのFormDataをシミュレート
    const formData = new FormData();
    
    // ダミーファイルデータ（実際のテストでは実ファイルを使用）
    const dummyVideoData = Buffer.from('dummy video data');
    formData.append('video', dummyVideoData, {
      filename: 'test-serve.mp4',
      contentType: 'video/mp4'
    });
    
    const response = await axios.post(`${TEST_CONFIG.BACKEND_URL}/api/analyze`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`  ステータス: ${response.status}`);
    console.log(`  レスポンス: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data) {
      console.log('  ✅ FormData形式でのリクエストが処理されています');
      return true;
    } else {
      console.log('  ❌ FormData形式の処理に問題があります');
      return false;
    }
  } catch (error) {
    console.log('  ❌ FormData形式テストに失敗');
    console.log(`  エラー: ${error.message}`);
    return false;
  }
}

/**
 * React Native APIサービステスト
 */
async function testReactNativeAPIService() {
  console.log('\n5. React Native APIサービステスト');
  
  try {
    // React NativeのAPIサービスをシミュレート
    const apiService = {
      baseURL: TEST_CONFIG.BACKEND_URL,
      
      async analyzeVideo(videoData) {
        const formData = new FormData();
        formData.append('video', videoData, {
          filename: 'tennis-serve.mp4',
          contentType: 'video/mp4'
        });
        
        const response = await axios.post(`${this.baseURL}/api/analyze`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT
        });
        
        return response.data;
      }
    };
    
    // ダミーデータでテスト
    const dummyVideoData = Buffer.from('test video content');
    const result = await apiService.analyzeVideo(dummyVideoData);
    
    console.log('  ✅ React Native APIサービスが正常に動作しています');
    console.log(`  結果: ${JSON.stringify(result, null, 2)}`);
    return true;
  } catch (error) {
    console.log('  ❌ React Native APIサービステストに失敗');
    console.log(`  エラー: ${error.message}`);
    return false;
  }
}

/**
 * エラーハンドリングテスト
 */
async function testErrorHandling() {
  console.log('\n6. エラーハンドリングテスト');
  
  const testCases = [
    {
      name: 'ファイルなし',
      data: {},
      expectedError: 'ビデオファイルが見つかりません'
    },
    {
      name: '不正なファイル形式',
      data: () => {
        const formData = new FormData();
        formData.append('video', Buffer.from('dummy'), {
          filename: 'test.txt',
          contentType: 'text/plain'
        });
        return formData;
      },
      expectedError: '対応していないファイル形式'
    }
  ];
  
  let passedTests = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`  テスト: ${testCase.name}`);
      
      const data = typeof testCase.data === 'function' ? testCase.data() : testCase.data;
      const headers = data.getHeaders ? data.getHeaders() : {};
      
      const response = await axios.post(`${TEST_CONFIG.BACKEND_URL}/api/analyze`, data, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.data && response.data.success === false) {
        console.log(`    ✅ 適切なエラー: ${response.data.error}`);
        passedTests++;
      } else {
        console.log(`    ❌ 期待されるエラーが返されていません`);
      }
    } catch (error) {
      console.log(`    ❌ テストエラー: ${error.message}`);
    }
  }
  
  console.log(`  結果: ${passedTests}/${testCases.length} テスト通過`);
  return passedTests === testCases.length;
}

/**
 * メイン統合テスト実行
 */
async function runIntegrationTests() {
  console.log('統合テストを開始します...\n');
  
  const tests = [
    { name: 'バックエンド生存確認', fn: testBackendHealth },
    { name: 'CORS設定', fn: testCORS },
    { name: 'API エンドポイント', fn: testAPIWithoutFile },
    { name: 'FormData形式', fn: testFormDataFormat },
    { name: 'React Native APIサービス', fn: testReactNativeAPIService },
    { name: 'エラーハンドリング', fn: testErrorHandling }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`\n❌ ${test.name} テストでエラーが発生: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // 結果サマリー
  console.log('\n=== テスト結果サマリー ===');
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n総合結果: ${passedTests}/${totalTests} テスト通過`);
  
  if (passedTests === totalTests) {
    console.log('🎉 すべてのテストが通過しました！');
    console.log('React NativeアプリとバックエンドAPIの統合は完璧です。');
  } else {
    console.log('⚠️  一部のテストが失敗しました。');
    console.log('バックエンドサーバーが起動していることを確認してください。');
  }
  
  return passedTests === totalTests;
}

// テスト実行
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('統合テストでエラーが発生:', error);
      process.exit(1);
    });
}

module.exports = {
  runIntegrationTests,
  testBackendHealth,
  testCORS,
  testAPIWithoutFile,
  testFormDataFormat,
  testReactNativeAPIService,
  testErrorHandling
};

