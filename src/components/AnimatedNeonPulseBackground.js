import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 派手なサイバー・ネオン配色セット
const COLORS = [
  ['#00fff0', '#ff00ea'],    // ミントシアン → ピンク
  ['#2300ff', '#00ffe7'],    // ブルー → エメラルド
  ['#00ffae', '#f8ff00'],    // エメラルド → イエロー
  ['#ff1d77', '#00fff0'],    // ショッキングピンク → シアン
];

const ANIMATION_DURATION = 1800; // 1.8秒ごとに切り替え

export default function AnimatedNeonPulseBackground({ children }) {
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
        style={[StyleSheet.absoluteFill, { opacity: 0.88 }]}
      >
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </LinearGradient>
    </View>
  );
}