// src/components/AnimatedRedGradientBackground.js

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = ['#ff1a1a', '#ff8000', '#a741ff', '#fff83d']; // 赤, オレンジ, 紫, 黄色

const DURATION = 8000;

export default function AnimatedRedGradientBackground({ children }) {
  const idx = useRef(0);
  const [colors, setColors] = React.useState([COLORS[0], COLORS[1]]);

  useEffect(() => {
    let mounted = true;
    let interval;
    function animate() {
      interval = setInterval(() => {
        if (!mounted) return;
        idx.current = (idx.current + 1) % COLORS.length;
        const next = (idx.current + 1) % COLORS.length;
        setColors([COLORS[idx.current], COLORS[next]]);
      }, DURATION);
    }
    animate();
    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <LinearGradient
      colors={colors}
      style={StyleSheet.absoluteFill}
      start={[0, 0]}
      end={[1, 1]}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </LinearGradient>
  );
}