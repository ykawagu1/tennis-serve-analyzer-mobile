import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = [
  ['#ffecd2', '#fcb69f'], // ピンク→オレンジ
  ['#fcb69f', '#a1c4fd'], // オレンジ→スカイブルー
  ['#a1c4fd', '#c2e9fb'], // ブルー→水色
  ['#c2e9fb', '#ffecd2'], // 水色→ピンク
];
const ANIMATION_DURATION = 2200;

export default function AnimatedCandyPopBackground({ children }) {
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
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      >
        <View style={StyleSheet.absoluteFill}>{children}</View>
      </LinearGradient>
    </View>
  );
}