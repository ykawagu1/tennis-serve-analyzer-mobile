import os
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class AdviceGenerator:
    def __init__(self):
        """
        アドバイス生成器の初期化
        APIキーは環境変数 OPENAI_API_KEY のみ参照
        """
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.client = None
        if self.api_key:
            self._init_openai_client(self.api_key)
        else:
            logger.warning("OpenAI APIキーが環境変数にセットされていません")

    def _init_openai_client(self, api_key: str):
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            logger.info("OpenAI クライアント初期化成功（v1.0+）")
        except ImportError:
            try:
                import openai
                openai.api_key = api_key
                logger.info("OpenAI API キー設定成功（v0.x）")
            except ImportError:
                logger.error("OpenAI ライブラリがインストールされていません")

    def generate_advice(
        self,
        analysis_data: Dict,
        user_level: str = 'intermediate',
        focus_areas: List = None,
        use_chatgpt: Optional[bool] = False,
        user_concerns: str = ''
    ) -> Dict:
        """
        解析データに基づいてアドバイスを生成
        use_chatgpt: TrueのときのみAIアドバイスを生成（APIキーはサーバー環境変数のみ使用）
        """
        logger.info(f"アドバイス生成開始 - ChatGPT使用: {use_chatgpt}, 気になること: {bool(user_concerns)}")
        basic_advice = self._generate_basic_advice(analysis_data)

        # 有料（サブスク）プランだけAI詳細アドバイスを生成
        if use_chatgpt and self.api_key:
            try:
                logger.info("ChatGPT詳細アドバイス生成開始")
                enhanced_advice = self._generate_enhanced_advice(
                    analysis_data, basic_advice, user_concerns)
                logger.info(f"ChatGPT詳細アドバイス生成完了 - Enhanced: {enhanced_advice.get('enhanced', False)}")
                return enhanced_advice
            except Exception as e:
                logger.error(f"ChatGPT API呼び出しエラー: {e}")
                basic_advice["enhanced"] = False
                basic_advice["error"] = f"ChatGPT接続エラー: {str(e)}"
                if user_concerns:
                    basic_advice['one_point_advice'] = self._generate_basic_one_point_advice(user_concerns)
                return basic_advice
        else:
            # 無料プランは通常アドバイスのみ
            logger.info("無料枠なので詳細アドバイスは生成されません")
            if user_concerns:
                basic_advice['one_point_advice'] = self._generate_basic_one_point_advice(user_concerns)
            basic_advice['error'] = '有料プランのみAI詳細アドバイスを利用できます。'
            return basic_advice

    def _generate_basic_advice(self, analysis_data: Dict) -> Dict:
        """基本的なアドバイスを生成"""
        total_score = (
            analysis_data.get('total_score')
            or analysis_data.get('tiered_evaluation', {}).get('total_score')
            or analysis_data.get('overall_score')
            or 0
        )
        phase_analysis = analysis_data.get('phase_analysis', {})

        # 総合評価
        if total_score >= 8:
            overall = "素晴らしいサービスフォームです！細かい調整でさらに向上できます。"
        elif total_score >= 6:
            overall = "良好なサービスフォームです。いくつかの改善点があります。"
        elif total_score >= 4:
            overall = "基本的なフォームはできています。重要なポイントを改善しましょう。"
        else:
            overall = "フォームに改善の余地があります。基礎から見直しましょう。"

        technical_points = []
        practice_suggestions = []

        for phase, data in phase_analysis.items():
            score = data.get('score', 0) if isinstance(data, dict) else 0
            if score < 7:
                if phase in ["準備", "preparation"]:
                    technical_points.append("スタンス（足の位置）の安定性を向上させましょう")
                    practice_suggestions.append("壁に向かって正しいスタンスで素振り練習")
                elif phase in ["トスアップ", "ball_toss"]:
                    technical_points.append("トスの高さと位置の一貫性を改善しましょう")
                    practice_suggestions.append("一定の高さでトスを上げる反復練習")
                elif phase in ["バックスイング", "backswing"]:
                    technical_points.append("ラケットの引き方とタイミングを調整しましょう")
                    practice_suggestions.append("ゆっくりとしたシャドースイング練習")
                elif phase in ["フォワードスイング", "acceleration"]:
                    technical_points.append("スイングスピードと軌道を最適化しましょう")
                    practice_suggestions.append("段階的にスピードを上げるスイング練習")
                elif phase in ["インパクト", "contact"]:
                    technical_points.append("ボールとの接触点を改善しましょう")
                    practice_suggestions.append("ネット前でのインパクト確認練習")
                elif phase in ["フォロースルー", "follow_through"]:
                    technical_points.append("フィニッシュの形を安定させましょう")
                    practice_suggestions.append("フォロースルーを意識したスロー練習")

        result = {
            "basic_advice": overall,
            "technical_points": technical_points,
            "practice_suggestions": practice_suggestions,
            "enhanced": False
        }
        return result

    def _generate_enhanced_advice(self, analysis_data: Dict, basic_advice: Dict, user_concerns: str = '') -> Dict:
        """ChatGPT APIを使用して詳細なアドバイスを生成"""
        total_score = analysis_data.get('total_score', 0)
        phase_analysis = analysis_data.get('phase_analysis', {})

        # 詳細プロンプト作成
        prompt = self._create_detailed_prompt(total_score, phase_analysis, basic_advice, user_concerns)
        ai_response = self._call_chatgpt_api(prompt)
        if ai_response:
            logger.info("ChatGPT API呼び出し成功")
            enhanced_advice = self._parse_ai_response(ai_response, basic_advice)
            enhanced_advice["enhanced"] = True
            enhanced_advice["detailed_advice"] = ai_response
            enhanced_advice["enhanced_advice"] = ai_response   # UIで分かりやすく
            if user_concerns:
                enhanced_advice["one_point_advice"] = self._extract_one_point_advice(ai_response, user_concerns)
            return enhanced_advice
        else:
            logger.error("ChatGPT APIからの応答が空です")
            basic_advice["enhanced"] = False
            basic_advice["error"] = "ChatGPT APIからの応答が空でした"
            return basic_advice

    def _call_chatgpt_api(self, prompt: str) -> str:
        """ChatGPT APIを呼び出し（APIキーはサーバー内のみ保持）"""
        try:
            if self.client:
                logger.info("OpenAI v1.0+ APIを使用")
                response = self.client.chat.completions.create(
                    model="gpt-4.1-nano",
                    messages=[
                        {"role": "system", "content": """あなたは30年以上の経験を持つATP/WTAツアーのプロテニスコーチです。下記「ユーザーの具体的な悩み」に、必ず明確かつ具体的に答えてください。""" },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=5000,
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                logger.info("OpenAI v0.x APIを使用")
                import openai
                response = openai.ChatCompletion.create(
                    model="gpt-4.1-nano",
                    messages=[
                        {"role": "system", "content": """あなたは30年以上の経験を持つATP/WTAツアーのプロテニスコーチです。下記「ユーザーの具体的な悩み」に、必ず明確かつ具体的に答えてください。""" },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=5000,
                    temperature=0.7
                )
                return response.choices[0].message.content
        except Exception as e:
            logger.error(f"ChatGPT API呼び出しエラー: {e}")
            return None

    def _create_detailed_prompt(self, total_score: float, phase_analysis: Dict, basic_advice: Dict, user_concerns: str = '') -> str:
        """詳細なプロンプトを作成（user_concerns対応）"""
        phase_scores = []
        weak_phases = []
        for phase, data in phase_analysis.items():
            score = data.get('score', 0) if isinstance(data, dict) else 0
            phase_scores.append(f"{phase}: {score:.1f}点")
            if score < 7:
                weak_phases.append(phase)
        concerns_text = ""
        if user_concerns:
            concerns_text = f"\n\n【ユーザーの具体的な悩み】\n{user_concerns}\n\n上記の悩みに特に焦点を当てて、具体的で実践的なアドバイスを含めてください。"
        prompt = f"""
【テニスサーブ動作解析結果】

総合スコア: {total_score:.1f}/10点

フェーズ別スコア:
{chr(10).join(phase_scores)}

改善が必要なフェーズ: {', '.join(weak_phases) if weak_phases else 'なし'}

基本的な技術ポイント:
{chr(10).join(f"- {point}" for point in basic_advice.get('technical_points', []))}
{concerns_text}

この解析結果に基づいて、以下の構成で詳細なアドバイスを生成してください：
・（500文字程度）といった表現は絶対に表示しないでください。また箇条書きにして明確に記載してください。
1. フォーム改善点の詳細分析
2. 4週間トレーニングプログラム
3. フィジカル強化メニュー
4. 実戦での確認ポイント
5. ワンポイントアドバイス

特に改善が必要なフェーズ（{', '.join(weak_phases)}）に重点を置いて、具体的で実践的なアドバイスをお願いします。
【アドバイス生成要件】
・各項目で悩みに必ず言及し、一般論だけで済ませないこと。
・悩みが曖昧でも「考えられる理由」と「改善案」を必ず入れること。
・直接、テニスに関係ない悩みにも、共感と改善案を必ず入れること。
"""
        return prompt

    def _parse_ai_response(self, ai_response: str, basic_advice: Dict) -> Dict:
        """AI応答を解析してアドバイスデータに変換"""
        enhanced_advice = basic_advice.copy()
        enhanced_advice["detailed_advice"] = ai_response
        enhanced_advice["enhanced"] = True
        return enhanced_advice

    def _extract_one_point_advice(self, ai_response: str, user_concerns: str) -> str:
        """AI応答からワンポイントアドバイスを抽出"""
        lines = ai_response.split('\n')
        one_point_section = False
        one_point_advice = []
        for line in lines:
            if 'ワンポイント' in line or '即効性' in line:
                one_point_section = True
                continue
            elif one_point_section and line.strip():
                if line.startswith('#') and 'ワンポイント' not in line:
                    break
                one_point_advice.append(line.strip())
        if one_point_advice:
            return '\n'.join(one_point_advice)
        else:
            return self._generate_basic_one_point_advice(user_concerns)

    def _generate_basic_one_point_advice(self, user_concerns: str) -> str:
        """user_concernsに基づく基本的なワンポイントアドバイス"""
        concerns_lower = user_concerns.lower()
        if 'トス' in user_concerns or 'toss' in concerns_lower:
            return "トスの安定性向上のため、毎日10回、同じ高さ・同じ位置にトスを上げる練習を行いましょう。"
        elif '威力' in user_concerns or 'パワー' in user_concerns or 'power' in concerns_lower:
            return "サーブの威力向上には、体幹の回転を意識し、下半身から上半身への運動連鎖を強化しましょう。"
        elif 'フォーム' in user_concerns or 'form' in concerns_lower:
            return "フォームの安定には、鏡の前でのスロー練習を週3回、各10分間行うことが効果的です。"
        elif 'コントロール' in user_concerns or 'control' in concerns_lower:
            return "コントロール向上のため、ターゲットを設置してのサーブ練習を1日20球から始めましょう。"
        else:
            return "まずは基本的なサーブフォームの確認から始め、一つずつ改善点を意識して練習しましょう。"

    def _generate_fallback_advice(self) -> Dict:
        """エラー時のフォールバックアドバイス"""
        return {
            "basic_advice": "サーブフォームの基本を確認し、段階的に改善していきましょう。",
            "technical_points": [
                "正しいスタンスの確認",
                "トスの一貫性向上",
                "スムーズなスイング動作"
            ],
            "practice_suggestions": [
                "基本フォームの反復練習",
                "ターゲット練習",
                "スロー練習からの段階的向上"
            ],
            "enhanced": False,
            "error": "アドバイス生成中にエラーが発生しました"
        }
