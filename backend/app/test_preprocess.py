import cv2
import os
from pathlib import Path

def preprocess_video(input_path: str, output_path: str, frame_skip: int = 3, scale: float = 0.5):
    """
    動画を間引き＆解像度低下して保存

    Args:
        input_path (str): 入力動画ファイルのパス
        output_path (str): 出力動画ファイルのパス
        frame_skip (int): 何フレームごとに1フレーム残すか
        scale (float): 解像度スケーリング係数（例: 0.5で半分）
    """
    if not os.path.exists(input_path):
        print(f"❌ 入力ファイルが見つかりません: {input_path}")
        return

    print(f"🎥 入力動画: {input_path}")
    print(f"📁 出力先動画: {output_path}")
    print(f"🔧 設定: フレーム間引き={frame_skip}, 解像度スケーリング={scale}")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(f"❌ 動画を開けませんでした: {input_path}")
        return

    # 入力動画情報
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    fps = original_fps / frame_skip if original_fps > 0 else 10.0  # fps取得失敗時は10fps
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) * scale)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) * scale)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # 出力ファイル拡張子でエンコーダーを選択
    ext = Path(output_path).suffix.lower()
    if ext in [".mp4", ".m4v"]:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    elif ext in [".avi"]:
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
    elif ext in [".mov"]:
        fourcc = cv2.VideoWriter_fourcc(*'avc1')  # QuickTime互換
    else:
        print(f"❌ サポートされていない出力フォーマット: {ext}")
        return

    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    frame_count = 0
    kept_frames = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_skip == 0:
            resized_frame = cv2.resize(frame, (width, height))
            out.write(resized_frame)
            kept_frames += 1

        frame_count += 1

    cap.release()
    out.release()

    print("✅ 前処理完了")
    print(f"📊 総フレーム数={total_frames}, 保存フレーム数={kept_frames}")
    print(f"🆕 新FPS={fps:.2f}, 新解像度={width}x{height}")


if __name__ == "__main__":
    # 🔽 ここに入力ファイルのパスを書き換え
    input_file = "IMG_1820.MOV"   # mp4, avi, mov 何でもOK
    output_file = "preprocessed_output.mp4"  # 出力形式も自由

    # 前処理実行
    preprocess_video(input_file, output_file, frame_skip=3, scale=0.5)
