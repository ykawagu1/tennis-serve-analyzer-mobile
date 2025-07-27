import React from 'react';
import AnimatedGradientBackgroundBase from './AnimatedGradientBackgroundBase';

const COLORS = ['#232526', '#414345', '#005c97', '#363795'];
export default function AnimatedNightSkyGradientBackground({ children }) {
  return <AnimatedGradientBackgroundBase colors={COLORS}>{children}</AnimatedGradientBackgroundBase>;
}