#!/usr/bin/env python3
"""
テニスサービス動作解析 - 統合テストスクリプト
動画処理、ポーズ検出、動作解析の統合テスト
"""

import sys
import os
import json
import time
from pathlib import Path
from typing import Dict

# プロジェクトルートをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from services.video_processor import VideoProcessor
from services.pose_detector import PoseDetector
from services.motion_analyzer import MotionAnalyzer


class TennisServeAnalyzer:
    """テニスサービス解析の統合クラス"""
    
    def __init__(self):
        """解析器の初期化"""
        self.video_processor = VideoProcessor()
        self.pose_detector = PoseDetector()
        self.motion_analyzer = MotionAnalyzer()
        
        print("テニスサービス解析器を初期化しました")
    
    def analyze_video(self, video_path: str, output_dir: str = "output") -> Dict:
        """
        動画の包括的解析
        
        Args:
            video_path: 入力動画ファイルパス
            output_dir: 出力ディレクトリ
            
        Returns:
            解析結果の辞書
        """
        print(f"=== 動画解析開始: {video_path} ===")
        start_time = time.time()
        
        # 出力ディレクトリ作成
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            # Step 1: 動画検証
            print("\n1. 動画ファイル検証中...")
            validation_result = self.video_processor.validate_video(video_path)
            
            if not validation_result['is_valid']:
                raise ValueError(f"動画検証失敗: {validation_result['error_message']}")
            
            print("✓ 動画検証完了")
            if validation_result['warnings']:
                for warning in validation_result['warnings']:
                    print(f"  警告: {warning}")
            
            # Step 2: 動画前処理
            print("\n2. 動画前処理中...")
            preprocessed_path = self.video_processor.preprocess_video(
                video_path, 
                os.path.join(output_dir, "preprocessed_video.mp4")
            )
            print(f"✓ 前処理完了: {preprocessed_path}")
            
            # Step 3: ポーズ検出
            print("\n3. ポーズ検出実行中...")
            pose_results = self.pose_detector.process_video(
                preprocessed_path,
                os.path.join(output_dir, "pose_visualization.mp4")
            )
            
            # ポーズデータ保存
            pose_data_path = os.path.join(output_dir, "pose_data.json")
            self.pose_detector.save_pose_data(pose_results, pose_data_path)
            print(f"✓ ポーズ検出完了: {len(pose_results)}フレーム")
            
            # ポーズ検出統計
            pose_stats = self.pose_detector.get_pose_statistics(pose_results)
            print(f"  検出率: {pose_stats['detection_rate']:.1%}")
            print(f"  平均信頼度: {pose_stats['average_confidence']:.3f}")
            
            # Step 4: 動作解析
            print("\n4. 動作解析実行中...")
            analysis_result = self.motion_analyzer.analyze_serve_motion(pose_results)
            
            # 解析結果保存
            analysis_result_path = os.path.join(output_dir, "analysis_result.json")
            with open(analysis_result_path, 'w', encoding='utf-8') as f:
                json.dump(analysis_result, f, indent=2, ensure_ascii=False)
            
            print(f"✓ 動作解析完了")
            print(f"  総合スコア: {analysis_result['overall_score']:.1f}/10.0")
            
            # Step 5: 結果サマリー生成
            summary = self._generate_summary(
                validation_result, 
                pose_stats, 
                analysis_result
            )
            
            summary_path = os.path.join(output_dir, "analysis_summary.json")
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            # 処理時間計算
            total_time = time.time() - start_time
            print(f"\n=== 解析完了 (処理時間: {total_time:.1f}秒) ===")
            
            return {
                'success': True,
                'output_directory': output_dir,
                'processing_time': total_time,
                'files': {
                    'preprocessed_video': preprocessed_path,
                    'pose_visualization': os.path.join(output_dir, "pose_visualization.mp4"),
                    'pose_data': pose_data_path,
                    'analysis_result': analysis_result_path,
                    'summary': summary_path
                },
                'analysis_result': analysis_result,
                'summary': summary
            }
            
        except Exception as e:
            error_message = f"解析中にエラーが発生しました: {str(e)}"
            print(f"\n❌ {error_message}")
            
            return {
                'success': False,
                'error_message': error_message,
                'processing_time': time.time() - start_time
            }
        
        finally:
            # クリーンアップ
            self.video_processor.cleanup_temp_files()
    
    def _generate_summary(self, validation_result: Dict, pose_stats: Dict, analysis_result: Dict) -> Dict:
        """解析結果のサマリー生成"""
        
        # 技術要素別スコア抽出
        technical_scores = {}
        key_issues = []
        recommendations = []
        
        for category, results in analysis_result['technical_analysis'].items():
            technical_scores[category] = results.get('overall_score', 0.0)
            
            if 'issues' in results:
                key_issues.extend(results['issues'])
            
            if 'recommendations' in results:
                recommendations.extend(results['recommendations'])
        
        # サーブフェーズ情報
        phase_info = {}
        for phase_name, phase_data in analysis_result['serve_phases'].items():
            phase_info[phase_name] = {
                'duration': phase_data['duration'],
                'frame_range': f"{phase_data['start_frame']}-{phase_data['end_frame']}"
            }
        
        return {
            'analysis_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'video_info': validation_result['metadata'],
            'pose_detection': {
                'detection_rate': pose_stats['detection_rate'],
                'average_confidence': pose_stats['average_confidence'],
                'total_frames': pose_stats['total_frames'],
                'detected_frames': pose_stats['detected_frames']
            },
            'overall_score': analysis_result['overall_score'],
            'technical_scores': technical_scores,
            'serve_phases': phase_info,
            'key_issues': key_issues[:5],  # 上位5つの問題点
            'recommendations': recommendations[:5],  # 上位5つの推奨事項
            'performance_level': self._classify_performance_level(analysis_result['overall_score'])
        }
    
    def _classify_performance_level(self, overall_score: float) -> str:
        """総合スコアからパフォーマンスレベルを分類"""
        if overall_score >= 8.5:
            return "上級者"
        elif overall_score >= 7.0:
            return "中級者"
        elif overall_score >= 5.5:
            return "初中級者"
        elif overall_score >= 4.0:
            return "初級者"
        else:
            return "初心者"
    
    def print_analysis_summary(self, result: Dict):
        """解析結果のサマリーを表示"""
        if not result['success']:
            print(f"❌ 解析失敗: {result['error_message']}")
            return
        
        summary = result['summary']
        
        print("\n" + "="*60)
        print("           テニスサービス解析結果サマリー")
        print("="*60)
        
        print(f"\n📹 動画情報:")
        video_info = summary['video_info']
        print(f"  ファイル名: {video_info['filename']}")
        print(f"  解像度: {video_info['width']}x{video_info['height']}")
        print(f"  時間: {video_info['duration']:.1f}秒")
        print(f"  フレームレート: {video_info['fps']:.1f}fps")
        
        print(f"\n🎯 ポーズ検出:")
        pose_info = summary['pose_detection']
        print(f"  検出率: {pose_info['detection_rate']:.1%}")
        print(f"  平均信頼度: {pose_info['average_confidence']:.3f}")
        print(f"  処理フレーム数: {pose_info['detected_frames']}/{pose_info['total_frames']}")
        
        print(f"\n📊 総合評価:")
        print(f"  総合スコア: {summary['overall_score']:.1f}/10.0")
        print(f"  パフォーマンスレベル: {summary['performance_level']}")
        
        print(f"\n📈 技術要素別スコア:")
        for category, score in summary['technical_scores'].items():
            category_name = {
                'knee_movement': '膝の動き',
                'elbow_position': '肘の位置',
                'toss_trajectory': 'トス軌道',
                'body_rotation': '体の回転',
                'timing': 'タイミング'
            }.get(category, category)
            print(f"  {category_name}: {score:.1f}/10.0")
        
        print(f"\n⚠️  主な改善点:")
        for i, issue in enumerate(summary['key_issues'], 1):
            print(f"  {i}. {issue}")
        
        print(f"\n💡 推奨事項:")
        for i, recommendation in enumerate(summary['recommendations'], 1):
            print(f"  {i}. {recommendation}")
        
        print(f"\n📁 出力ファイル:")
        for file_type, file_path in result['files'].items():
            file_name = {
                'preprocessed_video': '前処理済み動画',
                'pose_visualization': 'ポーズ可視化動画',
                'pose_data': 'ポーズデータ',
                'analysis_result': '詳細解析結果',
                'summary': 'サマリー'
            }.get(file_type, file_type)
            print(f"  {file_name}: {file_path}")
        
        print(f"\n⏱️  処理時間: {result['processing_time']:.1f}秒")
        print("="*60)


def create_sample_video():
    """テスト用のサンプル動画を作成"""
    import cv2
    import numpy as np
    
    # サンプル動画のパラメータ
    width, height = 640, 480
    fps = 30
    duration = 5  # 5秒
    total_frames = fps * duration
    
    output_path = "sample_tennis_serve.mp4"
    
    # 動画ライター設定
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    print(f"サンプル動画作成中: {output_path}")
    
    try:
        for frame_num in range(total_frames):
            # 背景作成（テニスコート風）
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            frame[:] = (34, 139, 34)  # 緑色の背景
            
            # 簡単な人型の描画（サーブ動作をシミュレート）
            progress = frame_num / total_frames
            
            # 体の中心位置
            center_x = width // 2
            center_y = height // 2 + 50
            
            # サーブ動作のシミュレーション
            if progress < 0.2:  # 準備フェーズ
                arm_angle = 0
                knee_bend = 0
            elif progress < 0.4:  # トスフェーズ
                arm_angle = progress * 90
                knee_bend = progress * 20
            elif progress < 0.6:  # トロフィーポジション
                arm_angle = 90 + (progress - 0.4) * 45
                knee_bend = 20 + (progress - 0.4) * 30
            elif progress < 0.8:  # 加速フェーズ
                arm_angle = 135 + (progress - 0.6) * 90
                knee_bend = 50 - (progress - 0.6) * 40
            else:  # フォロースルー
                arm_angle = 225 + (progress - 0.8) * 45
                knee_bend = 10 - (progress - 0.8) * 10
            
            # 人型の描画
            # 頭
            cv2.circle(frame, (center_x, center_y - 80), 20, (255, 255, 255), -1)
            
            # 体
            cv2.line(frame, (center_x, center_y - 60), (center_x, center_y + 40), (255, 255, 255), 3)
            
            # 腕（右腕のサーブ動作）
            arm_length = 60
            arm_x = center_x + int(arm_length * np.cos(np.radians(arm_angle)))
            arm_y = center_y - 20 + int(arm_length * np.sin(np.radians(arm_angle)))
            cv2.line(frame, (center_x, center_y - 20), (arm_x, arm_y), (255, 255, 255), 3)
            
            # 左腕（トス）
            left_arm_y = center_y - 20 - int(30 * progress) if progress < 0.4 else center_y - 20 - int(30 * (0.8 - progress))
            cv2.line(frame, (center_x, center_y - 20), (center_x - 40, left_arm_y), (255, 255, 255), 3)
            
            # 脚（膝の曲げ）
            leg_y = center_y + 40 + int(knee_bend)
            cv2.line(frame, (center_x, center_y + 40), (center_x - 20, leg_y), (255, 255, 255), 3)
            cv2.line(frame, (center_x, center_y + 40), (center_x + 20, leg_y), (255, 255, 255), 3)
            
            # ボール（トス中のみ）
            if 0.2 <= progress <= 0.6:
                ball_height = center_y - 20 - int(100 * np.sin(np.pi * (progress - 0.2) / 0.4))
                cv2.circle(frame, (center_x - 40, ball_height), 5, (0, 255, 255), -1)
            
            out.write(frame)
            
            # 進捗表示
            if frame_num % 30 == 0:
                print(f"進捗: {(frame_num / total_frames) * 100:.1f}%")
    
    finally:
        out.release()
    
    print(f"サンプル動画作成完了: {output_path}")
    return output_path


def main():
    """メイン関数"""
    print("テニスサービス動作解析システム - 統合テスト")
    
    # コマンドライン引数の処理
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
    else:
        # サンプル動画を作成
        print("\n動画ファイルが指定されていません。サンプル動画を作成します...")
        video_path = create_sample_video()
    
    if not os.path.exists(video_path):
        print(f"❌ 動画ファイルが見つかりません: {video_path}")
        return
    
    # 解析器の初期化
    analyzer = TennisServeAnalyzer()
    
    # 解析実行
    result = analyzer.analyze_video(video_path)
    
    # 結果表示
    analyzer.print_analysis_summary(result)
    
    if result['success']:
        print(f"\n✅ 解析が正常に完了しました。")
        print(f"詳細な結果は '{result['output_directory']}' ディレクトリを確認してください。")
    else:
        print(f"\n❌ 解析が失敗しました。")


if __name__ == "__main__":
    main()

