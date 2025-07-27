import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = ['#f7971e', '#ffd200', '#fff6b7', '#fff'];
export default function AnimatedGoldGradientBackground({ children }) {
  return <AnimatedGradientBackgroundBase colors={COLORS}>{children}</AnimatedGradientBackgroundBase>;
}