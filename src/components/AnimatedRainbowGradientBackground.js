import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

// レインボー系の色
const COLORS = [
  '#ff6e7f', // ピンク→レッド
  '#bfe9ff', // 水色
  '#f7ff00', // イエロー
  '#43cea2', // グリーン
  '#185a9d', // ディープブルー
  '#a8ff78', // ライトグリーン
  '#f7971e', // オレンジ
];

// 子コンポーネントでラップ
export default function AnimatedRainbowGradientBackground({ children }) {
  return (
    <AnimatedGradientBackgroundBase colors={COLORS}>
      {children}
    </AnimatedGradientBackgroundBase>
  );
}