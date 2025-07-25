"""
テニスサーブ解析システム - メインアプリケーション（video_processor修正版）
process_video メソッドの戻り値問題を修正
"""

import os
import sys
import logging
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid

# パスの設定（相対インポートの問題を解決）
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# サービスのインポート（相対パスに修正）
from services.video_processor import VideoProcessor
from services.pose_detector import PoseDetector
from services.motion_analyzer import MotionAnalyzer
from services.advice_generator import AdviceGenerator

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 設定
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
OUTPUT_FOLDER = 'output'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

# フォルダ作成
for folder in [UPLOAD_FOLDER, PROCESSED_FOLDER, OUTPUT_FOLDER]:
    os.makedirs(folder, exist_ok=True)

def allowed_file(filename):
    """許可されたファイル形式かチェック"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """動画解析のメインエンドポイント"""
    try:
        logger.info("=== 動画解析リクエスト受信 ===")
        
        # ファイルの確認
        if 'video' not in request.files:
            return jsonify({'success': False, 'error': 'ビデオファイルが見つかりません'}), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'ファイルが選択されていません'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': '対応していないファイル形式です'}), 400
        
        # パラメータの取得
        use_chatgpt = request.form.get('use_chatgpt', 'false').lower() == 'true'
        api_key = request.form.get('api_key', '')
        user_concerns = request.form.get('user_concerns', '')
        user_level = request.form.get('user_level', 'intermediate')
        focus_areas = request.form.get('focus_areas', '[]')
        
        logger.info(f"解析パラメータ:")
        logger.info(f"- use_chatgpt: {use_chatgpt}")
        logger.info(f"- user_level: {user_level}")
        logger.info(f"- user_concerns: {user_concerns}")
        logger.info(f"- focus_areas: {focus_areas}")
        
        # ファイル保存
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        video_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(video_path)
        
        logger.info(f"ファイル保存完了: {video_path}")
        
        # 出力ディレクトリの作成
        output_dir = os.path.join(OUTPUT_FOLDER, str(uuid.uuid4()))
        os.makedirs(output_dir, exist_ok=True)
        
        # 解析実行
        analysis_result = perform_analysis(
            video_path, output_dir, user_level, focus_areas, use_chatgpt, api_key, user_concerns
        )
        
        logger.info("=== 動画解析完了 ===")
        return jsonify({
            'success': True,
            'result': analysis_result
        })
        
    except Exception as e:
        logger.error(f"解析エラー: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def perform_analysis(video_path: str, output_dir: str, user_level: str, focus_areas: str, 
                    use_chatgpt: bool, api_key: str, user_concerns: str) -> dict:
    """解析処理の実行"""
    try:
        logger.info("=== perform_analysis 開始 ===")
        
        # Step 1: 動画前処理（修正版）
        logger.info("Step 1: 動画前処理を開始")
        video_processor = VideoProcessor()
        
        # video_processorの実際のメソッドを確認して適切に呼び出し
        try:
            # まず検証を実行
            validation_result = video_processor.validate_video(video_path)
            if not validation_result['is_valid']:
                raise ValueError(f"動画検証エラー: {validation_result['error_message']}")
            
            # 前処理を実行（preprocess_videoメソッドを使用）
            processed_video_path = video_processor.preprocess_video(video_path)
            
            # メタデータを取得
            video_metadata = video_processor.get_video_metadata(processed_video_path)
            if not video_metadata:
                video_metadata = {
                    'fps': 30,
                    'width': 1280,
                    'height': 720,
                    'duration': 5.0,
                    'frame_count': 150
                }
            
            logger.info(f"動画前処理完了: {processed_video_path}")
            logger.info(f"動画メタデータ: {video_metadata}")
            
        except Exception as e:
            logger.warning(f"動画前処理エラー、元ファイルを使用: {e}")
            processed_video_path = video_path
            video_metadata = {
                'fps': 30,
                'width': 1280,
                'height': 720,
                'duration': 5.0,
                'frame_count': 150
            }
        
        # Step 2: ポーズ検出（output_dir引数を追加）
        logger.info("Step 2: ポーズ検出を開始")
        pose_detector = PoseDetector()
        pose_results = pose_detector.detect_poses(processed_video_path, output_dir)
        logger.info(f"ポーズ検出完了: {len(pose_results)} フレーム")
        
        # ポーズ検出結果の詳細確認
        if pose_results:
            pose_frames = [i for i, frame in enumerate(pose_results) if frame.get('landmarks')]
            logger.info(f"ポーズが検出されたフレーム数: {len(pose_frames)}")
        
        # Step 3: サーブフェーズ検出
        logger.info("Step 3: サーブフェーズ検出")
        serve_phases = detect_serve_phases(pose_results, video_metadata)
        logger.info(f"サーブフェーズ検出完了: {len(serve_phases)} フェーズ")
        
        # Step 4: 動作解析
        logger.info("Step 4: 動作解析を開始")
        motion_analyzer = MotionAnalyzer()
        analysis_result = motion_analyzer.analyze_motion(
            pose_results, serve_phases, video_metadata
        )
        logger.info("動作解析完了")
        
        # Step 5: 段階的評価
        logger.info("Step 5: 段階的評価")
        tiered_evaluation = motion_analyzer.calculate_tiered_overall_score(analysis_result)
        analysis_result['tiered_evaluation'] = tiered_evaluation
        logger.info(f"段階的評価完了: {tiered_evaluation.get('skill_level_name', '不明')}")
        
        # Step 6: アドバイス生成
        logger.info("Step 6: アドバイス生成")
        advice_generator = AdviceGenerator()
        advice = advice_generator.generate_advice(
            analysis_result, 
            use_chatgpt=use_chatgpt,
            api_key=api_key if use_chatgpt else None,
            user_concerns=user_concerns,
            user_level=user_level
        )
        analysis_result['advice'] = advice
        logger.info("アドバイス生成完了")
        
        logger.info("=== perform_analysis 完了 ===")
        return analysis_result
        
    except Exception as e:
        logger.error(f"=== perform_analysis エラー ===")
        logger.error(f"エラータイプ: {type(e).__name__}")
        logger.error(f"エラーメッセージ: {e}")
        logger.error(traceback.format_exc())
        logger.error("==================================")
        raise e

def detect_serve_phases(pose_results, video_metadata):
    """サーブフェーズの検出（簡易版）"""
    try:
        from services.motion_analyzer import ServePhase
        
        total_frames = len(pose_results)
        if total_frames == 0:
            return []
        
        # 簡易的なフェーズ分割
        phase_duration = total_frames // 6
        phases = []
        
        phase_names = [
            'preparation',
            'ball_toss', 
            'trophy_position',
            'acceleration',
            'contact',
            'follow_through'
        ]
        
        for i, name in enumerate(phase_names):
            start_frame = i * phase_duration
            end_frame = min((i + 1) * phase_duration, total_frames)
            duration = (end_frame - start_frame) / video_metadata.get('fps', 30)
            
            phase = ServePhase(
                name=name,
                start_frame=start_frame,
                end_frame=end_frame,
                duration=duration,
                key_events=[]
            )
            phases.append(phase)
        
        return phases
        
    except Exception as e:
        logger.error(f"サーブフェーズ検出エラー: {e}")
        return []

@app.route('/api/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    logger.info("テニスサーブ解析システム起動中...")
    app.run(host='0.0.0.0', port=5000, debug=True)

