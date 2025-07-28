import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = [
  ['#fff600', '#ff0000'],    // イエロー×レッド（危険色）
  ['#00ffea', '#ff00ec'],    // シアン×ピンク
  ['#00ff00', '#0000ff'],    // 緑×青
  ['#fff', '#000'],          // 白×黒（最強の点滅ｗ）
  ['#ff5e62', '#ff9966'],    // オレンジグラデ
];

const ANIMATION_DURATION = 200; // 0.2秒で切り替え（点滅感UP）

export default function AnimatedNeonStrobeBackground({ children }) {
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
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      >
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </LinearGradient>
    </View>
  );
}