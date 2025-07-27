import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = [
  '#ff6e7f', '#bfe9ff', '#f7ff00', '#43cea2',
  '#185a9d', '#a8ff78', '#f7971e'
];
export default function AnimatedRainbowGradientBackground({ children }) {
  return <AnimatedGradientBackgroundBase colors={COLORS}>{children}</AnimatedGradientBackgroundBase>;
}