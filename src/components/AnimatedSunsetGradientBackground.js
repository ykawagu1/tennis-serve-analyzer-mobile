// AnimatedSunsetGradientBackground.js
import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = [
  '#f3904f', // オレンジ
  '#ffb56b', // 黄オレンジ
  '#ff5858', // 赤
  '#a18cd1', // 紫
  '#fbc2eb', // ピンク
  '#fceabb', // 黄色
];

export default function AnimatedSunsetGradientBackground({ children }) {
  return (
    <AnimatedGradientBackgroundBase colors={COLORS}>
      {children}
    </AnimatedGradientBackgroundBase>
  );
}