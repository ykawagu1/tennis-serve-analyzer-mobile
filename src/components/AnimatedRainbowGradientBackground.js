import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// 🌈 Rainbow系カラーリスト
const COLORS = [
  '#ff5f6d', // red-pink
  '#ffc371', // yellow-orange
  '#47cf73', // green
  '#3c9ee7', // blue
  '#a259c1', // purple
];

const ANIMATION_DURATION = 12000; // 12秒で一周

// 線形補間
function lerpColor(a, b, t) {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16);
  const bg = parseInt(bh.substring(2, 4), 16);
  const bb = parseInt(bh.substring(4, 6), 16);
  const red = Math.round(ar + (br - ar) * t);
  const green = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);
  return `rgb(${red},${green},${blue})`;
}

export default function AnimatedRainbowGradientBackground({ children }) {
  const [colors, setColors] = useState([COLORS[0], COLORS[1]]);
  const idx = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      tRef.current += 1 / 60 / (ANIMATION_DURATION / 1000);
      if (tRef.current > 1) {
        tRef.current = 0;
        idx.current = (idx.current + 1) % COLORS.length;
      }
      const nextIdx = (idx.current + 1) % COLORS.length;
      const c1 = lerpColor(COLORS[idx.current], COLORS[nextIdx], tRef.current);
      const c2 = lerpColor(COLORS[nextIdx], COLORS[(nextIdx + 1) % COLORS.length], tRef.current);
      if (mounted) setColors([c1, c2]);
    }, 16); // 60fps
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}