/**
 * ファイル関連のユーティリティ関数
 */

// サポートされている動画ファイル形式
export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.avi', '.mov', '.mkv', '.m4v', '.wmv'];

// 最大ファイルサイズ（100MB）
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * ファイル形式が有効かどうかをチェック
 * @param {string} fileName - ファイル名
 * @returns {boolean} 有効な形式かどうか
 */
export const isValidVideoFormat = (fileName) => {
  if (!fileName) return false;
  
  const lowerFileName = fileName.toLowerCase();
  return SUPPORTED_VIDEO_FORMATS.some(format => lowerFileName.endsWith(format));
};

/**
 * ファイルサイズが有効かどうかをチェック
 * @param {number} fileSize - ファイルサイズ（バイト）
 * @returns {boolean} 有効なサイズかどうか
 */
export const isValidFileSize = (fileSize) => {
  return fileSize <= MAX_FILE_SIZE;
};

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたファイルサイズ
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * ファイルの拡張子を取得
 * @param {string} fileName - ファイル名
 * @returns {string} 拡張子（ドット付き）
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
};

/**
 * ファイルの基本名（拡張子なし）を取得
 * @param {string} fileName - ファイル名
 * @returns {string} 基本名
 */
export const getBaseName = (fileName) => {
  if (!fileName) return '';
  
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
};

/**
 * ファイルの完全な検証を実行
 * @param {Object} file - ファイルオブジェクト
 * @returns {Object} 検証結果 { isValid: boolean, error: string }
 */
export const validateVideoFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'ファイルが選択されていません' };
  }

  if (!file.name) {
    return { isValid: false, error: 'ファイル名が不正です' };
  }

  if (!isValidVideoFormat(file.name)) {
    return { 
      isValid: false, 
      error: `サポートされていないファイル形式です。対応形式: ${SUPPORTED_VIDEO_FORMATS.join(', ')}` 
    };
  }

  if (file.size && !isValidFileSize(file.size)) {
    return { 
      isValid: false, 
      error: `ファイルサイズが大きすぎます。最大サイズ: ${formatFileSize(MAX_FILE_SIZE)}` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * 動画の推定時間を計算（ファイルサイズベース）
 * @param {number} fileSize - ファイルサイズ（バイト）
 * @returns {string} 推定時間
 */
export const estimateVideoDuration = (fileSize) => {
  // 大まかな推定（1MBあたり約10秒と仮定）
  const estimatedSeconds = Math.round(fileSize / (1024 * 1024) * 10);
  
  if (estimatedSeconds < 60) {
    return `約${estimatedSeconds}秒`;
  } else {
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return `約${minutes}分${seconds}秒`;
  }
};

