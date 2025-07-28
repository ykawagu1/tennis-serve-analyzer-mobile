// src/components/AnimatedGradientBackground.js
import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = [
  '#80d8ff', // 空色
  '#1976d2', // 青
  '#00bfae', // 緑
  '#d4ff37', // ライム
];

export default function AnimatedGradientBackground({ children }) {
  return (
    <AnimatedGradientBackgroundBase colors={COLORS}>
      {children}
    </AnimatedGradientBackgroundBase>
  );
}