import axios from 'axios';

// 開発時はローカル、本番時は適切なURLに変更
const API_BASE_URL = __DEV__ ? 'http://192.168.10.117:5001' : 'https://your-production-api.com';

class ApiService {
  constructor() {
    console.log('API_BASE_URL:', API_BASE_URL);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000, // 5分のタイムアウト（動画解析は時間がかかる可能性があるため）
    });
  }

  /**
   * 動画解析APIを呼び出す
   * @param {Object} file - 動画ファイル
   * @param {Object} options - オプション設定
   * @param {Function} onUploadProgress - アップロード進捗コールバック
   * @returns {Promise} API レスポンス
   */
  async analyzeVideo(file, options = {}, onUploadProgress = null) {
    try {
      const formData = new FormData();

      // ファイルを FormData に追加
      formData.append('video', {
        uri: file.uri,
        type: file.type || 'video/mp4',
        name: file.name || 'video.mp4',
      });

      // オプションを FormData に追加
      formData.append('use_chatgpt', options.useChatGPT ? 'true' : 'false');
      formData.append('user_concerns', options.userConcerns || '');

      // is_premium（有料フラグ）があれば追加
      if ('useChatGPT' in options) {
        formData.append('is_premium', options.useChatGPT ? 'true' : 'false');
      }

      // api_keyがあれば追加
      if (options.apiKey) {
        formData.append('api_key', options.apiKey);
      }

      // ---- デバッグ: formDataの全項目を列挙表示 ----
      console.log('------ 送信するformData内容 ------');
      for (let pair of formData.entries()) {
        // ファイルは大きすぎるので型だけ表示
        if (pair[0] === 'video') {
          console.log('video: { ...省略（file object）... }');
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }
      console.log('-------------------------------');

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      // アップロード進捗コールバックを設定
      if (onUploadProgress) {
        config.onUploadProgress = (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        };
      }

      console.log('>>> analyzeVideo POST', this.client.defaults.baseURL + '/api/analyze');

      const response = await this.client.post('/api/analyze', formData, config);

      console.log('>>> API response:', response);

      // レスポンスの検証
      if (response.data && response.data.success && response.data.result) {
        return response.data.result;
      } else {
        throw new Error('解析結果の形式が正しくありません');
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('API Error: ' + JSON.stringify(error));

      if (error.response?.data?.error) {
        throw new Error(`解析エラー: ${error.response.data.error}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('解析中にエラーが発生しました。もう一度お試しください。');
      }
    }
  }

  /**
   * サーバーの健康状態をチェック
   * @returns {Promise<boolean>} サーバーが正常かどうか
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * APIキーの有効性をチェック
   * @param {string} apiKey - OpenAI APIキー
   * @returns {Promise<boolean>} APIキーが有効かどうか
   */
  async validateApiKey(apiKey) {
    try {
      const response = await this.client.post('/api/validate-key', {
        api_key: apiKey,
      });
      return response.data.valid === true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

// シングルトンインスタンスをエクスポート
export default new ApiService();
