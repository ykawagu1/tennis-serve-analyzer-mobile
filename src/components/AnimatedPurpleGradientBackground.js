import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = [
  '#b993d6', // 薄紫
  '#8ca6db', // 青紫
  '#6e48aa', // 中紫
  '#cc2b5e', // 赤紫ピンク
];

const ANIMATION_DURATION = 9000; // 9秒でループ

function lerpColor(a, b, t) {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16), ag = parseInt(ah.substring(2, 4), 16), ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16), bg = parseInt(bh.substring(2, 4), 16), bb = parseInt(bh.substring(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b_ = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b_})`;
}

export default function AnimatedPurpleGradientBackground({ children }) {
  const stepRef = useRef(0);
  const [colors, setColors] = React.useState([COLORS[0], COLORS[1]]);

  useEffect(() => {
    let mounted = true;
    let t = 0, idx = 0, forward = true;

    const animate = () => {
      t += 1 / 60 / (ANIMATION_DURATION / 1000);
      if (t > 1) {
        t = 0;
        idx = (idx + 1) % COLORS.length;
      }
      const nextIdx = (idx + 1) % COLORS.length;
      const c1 = lerpColor(COLORS[idx], COLORS[nextIdx], t);
      const c2 = lerpColor(COLORS[nextIdx], COLORS[(nextIdx + 1) % COLORS.length], t);
      if (mounted) setColors([c1, c2]);
      requestAnimationFrame(animate);
    };
    animate();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
}