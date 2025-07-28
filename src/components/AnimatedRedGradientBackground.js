// src/components/AnimatedRedGradientBackground.js

import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = [
  '#ff1a1a', // 赤
  '#ff8000', // オレンジ
  '#a741ff', // 紫
//  '#fff83d', // 黄色
];

export default function AnimatedRedGradientBackground({ children }) {
  return (
    <AnimatedGradientBackgroundBase colors={COLORS}>
      {children}
    </AnimatedGradientBackgroundBase>
  );
}