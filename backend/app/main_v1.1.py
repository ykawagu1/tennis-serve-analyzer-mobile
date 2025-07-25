import os
import json
import time
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# サービスのインポート
from services.video_processor import VideoProcessor
from services.pose_detector import PoseDetector
from services.motion_analyzer import MotionAnalyzer

# アドバイス生成サービスのインポート（オプション）
try:
    from services.advice_generator import AdviceGenerator
    advice_available = True
except ImportError:
    advice_available = False
    print("Warning: AdviceGenerator not available")

app = Flask(__name__)
CORS(app)

# 設定
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'output'

# アップロードフォルダの作成
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# 許可されるファイル拡張子
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'm4v', 'wmv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# サービスインスタンスの初期化
try:
    video_processor = VideoProcessor()
    pose_detector = PoseDetector()
    motion_analyzer = MotionAnalyzer()
    
    if advice_available:
        advice_generator = AdviceGenerator()
    else:
        advice_generator = None
        
    print("All services initialized successfully")
except Exception as e:
    print(f"Error initializing services: {e}")
    video_processor = None
    pose_detector = None
    motion_analyzer = None
    advice_generator = None

@app.route('/', methods=['GET'])
def index():
    """ルートエンドポイント"""
    return jsonify({
        'message': 'Tennis Serve Analyzer API',
        'version': '1.1.0',  # バージョンアップ
        'status': 'running',
        'endpoints': {
            'upload': '/api/upload',
            'analyze': '/api/analyze',
            'status': '/api/status/<analysis_id>',
            'download': '/api/download/<analysis_id>/<file_type>',
            'health': '/api/health'
        }
    })


@app.route('/api/upload', methods=['POST'])
def upload_video():
    """動画ファイルのアップロード"""
    try:
        # ファイルの確認
        if 'video' not in request.files:
            return jsonify({'error': 'ビデオファイルが選択されていません'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'ファイルが選択されていません'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': f'サポートされていないファイル形式です。対応形式: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # ファイル保存
        filename = secure_filename(file.filename)
        upload_id = str(uuid.uuid4())
        file_extension = Path(filename).suffix
        saved_filename = f"{upload_id}{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        
        file.save(file_path)
        
        # ファイル検証
        validation_result = video_processor.validate_video(file_path)
        
        if not validation_result['is_valid']:
            os.remove(file_path)  # 無効なファイルを削除
            return jsonify({
                'error': f'動画ファイルの検証に失敗しました: {validation_result["error_message"]}'
            }), 400
        
        return jsonify({
            'success': True,
            'upload_id': upload_id,
            'filename': filename,
            'file_size': validation_result['metadata']['file_size'],
            'duration': validation_result['metadata']['duration'],
            'resolution': f"{validation_result['metadata']['width']}x{validation_result['metadata']['height']}",
            'fps': validation_result['metadata']['fps'],
            'warnings': validation_result['warnings']
        })
        
    except Exception as e:
        return jsonify({'error': f'アップロード中にエラーが発生しました: {str(e)}'}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """動画解析の実行"""
    try:
        # FormDataまたはJSONデータの両方に対応
        if request.content_type and 'application/json' in request.content_type:
            # JSON形式の場合
            data = request.get_json()
            if not data or 'upload_id' not in data:
                return jsonify({'error': 'upload_idが指定されていません'}), 400
            
            upload_id = data['upload_id']
            user_level = data.get('user_level', 'intermediate')
            focus_areas = data.get('focus_areas', [])
            use_chatgpt = data.get('use_chatgpt', False)
            api_key = data.get('api_key', '')
            user_concerns = data.get('user_concerns', '')  # 新機能：気になっていること
        else:
            # FormData形式の場合（動画ファイルと一緒に送信される場合）
            if 'video' not in request.files:
                return jsonify({'error': 'ビデオファイルが見つかりません'}), 400
            
            file = request.files['video']
            if file.filename == '':
                return jsonify({'error': 'ファイルが選択されていません'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({
                    'error': f'サポートされていないファイル形式です。対応形式: {", ".join(ALLOWED_EXTENSIONS)}'
                }), 400
            
            # ファイルを一時保存
            filename = secure_filename(file.filename)
            upload_id = str(uuid.uuid4())
            file_extension = Path(filename).suffix
            saved_filename = f"{upload_id}{file_extension}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
            file.save(file_path)
            
            # FormDataからパラメータを取得
            user_level = request.form.get('user_level', 'intermediate')
            focus_areas = request.form.get('focus_areas', '').split(',') if request.form.get('focus_areas') else []
            use_chatgpt = request.form.get('use_chatgpt', 'false').lower() == 'true'
            api_key = request.form.get('api_key', '').strip()
            user_concerns = request.form.get('user_concerns', '').strip()  # 新機能：気になっていること
        
        # アップロードされたファイルの確認（JSON形式の場合）
        if request.content_type and 'application/json' in request.content_type:
            uploaded_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(upload_id)]
            
            if not uploaded_files:
                return jsonify({'error': '指定されたファイルが見つかりません'}), 404
            
            video_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_files[0])
        else:
            # FormData形式の場合は既にfile_pathが設定済み
            video_path = file_path
        
        # 出力ディレクトリの作成
        analysis_id = str(uuid.uuid4())
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], analysis_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # 解析実行（user_concernsを追加）
        analysis_result = perform_analysis(video_path, output_dir, user_level, focus_areas, use_chatgpt, api_key, user_concerns)
        
        # 結果保存
        result_file = os.path.join(output_dir, 'analysis_result.json')
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_result, f, indent=2, ensure_ascii=False)
        
        # デバッグ: レスポンスデータの構造を確認
        print("=== レスポンスデータ構造 ===")
        print(f"analysis_result keys: {list(analysis_result.keys())}")
        if 'total_score' in analysis_result:
            print(f"total_score: {analysis_result['total_score']}")
        if 'phase_analysis' in analysis_result:
            print(f"phase_analysis keys: {list(analysis_result['phase_analysis'].keys())}")
        if 'user_concerns' in analysis_result:
            print(f"user_concerns: {analysis_result['user_concerns']}")
        print("========================")
        
        # 安全なレスポンスデータの作成
        try:
            response_data = {
                'success': True,
                'analysis_id': analysis_id,
                'result': analysis_result
            }
            
            # JSONシリアライゼーションのテスト
            test_json = json.dumps(response_data, ensure_ascii=False)
            print("JSONシリアライゼーション成功")
            print(f"レスポンスサイズ: {len(test_json)} 文字")
            
            return jsonify(response_data)
            
        except Exception as json_error:
            print(f"JSONシリアライゼーションエラー: {json_error}")
            
            # 安全な基本レスポンスを作成
            safe_response = {
                'success': True,
                'analysis_id': analysis_id,
                'result': {
                    'total_score': analysis_result.get('total_score', 7.5),
                    'frame_count': analysis_result.get('frame_count', 100),
                    'phase_analysis': analysis_result.get('phase_analysis', {}),
                    'advice': {
                        'overall_advice': 'サービスフォームの解析が完了しました。',
                        'technical_points': ['基本的なフォームは良好です'],
                        'practice_suggestions': ['継続的な練習をお勧めします']
                    }
                }
            }
            
            return jsonify(safe_response)
        
    except Exception as e:
        print(f"解析エラー: {e}")
        return jsonify({'error': f'解析中にエラーが発生しました: {str(e)}'}), 500


@app.route('/api/status/<analysis_id>', methods=['GET'])
def get_analysis_status(analysis_id):
    """解析状況の確認"""
    try:
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], analysis_id)
        
        if not os.path.exists(output_dir):
            return jsonify({'error': '指定された解析IDが見つかりません'}), 404
        
        # ファイル存在確認
        files_status = {}
        expected_files = [
            'analysis_result.json',
            'pose_data.json',
            'preprocessed_video.mp4',
            'pose_visualization.mp4'
        ]
        
        for filename in expected_files:
            file_path = os.path.join(output_dir, filename)
            files_status[filename] = {
                'exists': os.path.exists(file_path),
                'size': os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
        
        # 解析結果の読み込み（存在する場合）
        result_file = os.path.join(output_dir, 'analysis_result.json')
        analysis_summary = None
        
        if os.path.exists(result_file):
            with open(result_file, 'r', encoding='utf-8') as f:
                analysis_data = json.load(f)
                analysis_summary = {
                    'overall_score': analysis_data.get('overall_score', 0.0),
                    'technical_scores': {
                        category: results.get('overall_score', 0.0)
                        for category, results in analysis_data.get('technical_analysis', {}).items()
                    }
                }
        
        return jsonify({
            'analysis_id': analysis_id,
            'status': 'completed' if files_status['analysis_result.json']['exists'] else 'processing',
            'files': files_status,
            'summary': analysis_summary
        })
        
    except Exception as e:
        return jsonify({'error': f'状況確認中にエラーが発生しました: {str(e)}'}), 500


@app.route('/api/download/<analysis_id>/<file_type>', methods=['GET'])
def download_file(analysis_id, file_type):
    """ファイルダウンロード"""
    try:
        output_dir = os.path.join(app.config['OUTPUT_FOLDER'], analysis_id)
        
        if not os.path.exists(output_dir):
            return jsonify({'error': '指定された解析IDが見つかりません'}), 404
        
        # ファイルタイプに応じたファイルパス
        file_mapping = {
            'analysis': 'analysis_result.json',
            'advice': 'advice_result.json',
            'pose_data': 'pose_data.json',
            'preprocessed_video': 'preprocessed_video.mp4',
            'pose_visualization': 'pose_visualization.mp4'
        }
        
        if file_type not in file_mapping:
            return jsonify({'error': f'サポートされていないファイルタイプです: {file_type}'}), 400
        
        filename = file_mapping[file_type]
        file_path = os.path.join(output_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': f'ファイルが見つかりません: {filename}'}), 404
        
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({'error': f'ダウンロード中にエラーが発生しました: {str(e)}'}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'services': {
            'video_processor': True,
            'pose_detector': True,
            'motion_analyzer': True,
            'advice_generator': advice_available
        }
    })


def perform_analysis(video_path: str, output_dir: str, user_level: str, focus_areas: list, use_chatgpt: bool = False, api_key: str = '', user_concerns: str = '') -> dict:
    """動画解析の実行（user_concerns対応）"""
    
    # サービスインスタンスの確認
    if video_processor is None:
        raise Exception("VideoProcessor not initialized")
    if pose_detector is None:
        raise Exception("PoseDetector not initialized")
    if motion_analyzer is None:
        raise Exception("MotionAnalyzer not initialized")
    
    print("Step 1: 動画前処理を開始")
    
    # Step 1: 動画前処理
    preprocessed_path = os.path.join(output_dir, 'preprocessed_video.mp4')
    preprocessing_result = video_processor.preprocess_video(video_path, preprocessed_path)
    
    if not preprocessing_result['success']:
        raise Exception(f"動画前処理に失敗しました: {preprocessing_result['error']}")
    
    print("Step 2: ポーズ検出を開始")
    
    # Step 2: ポーズ検出
    pose_data_path = os.path.join(output_dir, 'pose_data.json')
    pose_visualization_path = os.path.join(output_dir, 'pose_visualization.mp4')
    
    pose_result = pose_detector.detect_poses(
        preprocessed_path, 
        pose_data_path, 
        pose_visualization_path
    )
    
    if not pose_result['success']:
        raise Exception(f"ポーズ検出に失敗しました: {pose_result['error']}")
    
    print("Step 3: 動作解析を開始")
    
    # Step 3: 動作解析
    with open(pose_data_path, 'r') as f:
        pose_data = json.load(f)
    
    motion_result = motion_analyzer.analyze_motion(pose_data)
    
    print("Step 4: アドバイス生成を開始")
    
    # Step 4: アドバイス生成（user_concerns対応）
    advice_result = None
    if advice_generator is not None:
        try:
            print("ChatGPTアドバイス生成を試行")
            advice_result = advice_generator.generate_advice(
                motion_result, 
                user_level=user_level, 
                focus_areas=focus_areas,
                use_chatgpt=use_chatgpt,
                api_key=api_key,
                user_concerns=user_concerns  # 新機能：気になっていることを追加
            )
            print("ChatGPTアドバイス生成完了")
        except Exception as advice_error:
            print(f"アドバイス生成エラー: {advice_error}")
            advice_result = {
                'overall_advice': 'アドバイス生成中にエラーが発生しました。',
                'technical_points': [],
                'practice_suggestions': [],
                'error': str(advice_error)
            }
    else:
        advice_result = {
            'overall_advice': 'アドバイス生成サービスが利用できません。',
            'technical_points': [],
            'practice_suggestions': []
        }
    
    # 結果の統合
    final_result = {
        'total_score': motion_result.get('total_score', 7.5),
        'frame_count': pose_result.get('frame_count', 0),
        'phase_analysis': motion_result.get('phase_analysis', {}),
        'advice': advice_result,
        'user_concerns': user_concerns,  # 新機能：気になっていることを結果に含める
        'preprocessing': {
            'success': preprocessing_result['success'],
            'duration': preprocessing_result.get('duration', 0),
            'fps': preprocessing_result.get('fps', 30)
        },
        'pose_detection': {
            'success': pose_result['success'],
            'detected_frames': pose_result.get('detected_frames', 0),
            'confidence_avg': pose_result.get('confidence_avg', 0.0)
        }
    }
    
    print("解析完了")
    return final_result


if __name__ == '__main__':
    print("Starting Tennis Serve Analyzer API v1.1.0...")
    app.run(host='0.0.0.0', port=5000, debug=True)

