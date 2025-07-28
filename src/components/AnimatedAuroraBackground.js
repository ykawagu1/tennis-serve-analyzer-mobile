import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = [
  ['#00c3ff', '#ffff1c'], // 青→黄
  ['#ffff1c', '#00ffc8'], // 黄→緑
  ['#00ffc8', '#ff61a6'], // 緑→ピンク
  ['#ff61a6', '#293462'], // ピンク→濃紺
  ['#293462', '#00c3ff'], // 濃紺→青
];
const ANIMATION_DURATION = 3000;

export default function AnimatedAuroraBackground({ children }) {
  const [colors, setColors] = useState(COLORS[0]);
  const idx = useRef(0);
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      idx.current = (idx.current + 1) % COLORS.length;
      if (mounted) setColors(COLORS[idx.current]);
    }, ANIMATION_DURATION);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={colors}
        start={{ x: 0.2, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </LinearGradient>
    </View>
  );
}