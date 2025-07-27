import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

function lerpColor(a, b, t) {
  const ah = a.replace('#', '');
  const bh = b.replace('#', '');
  const ar = parseInt(ah.substring(0, 2), 16);
  const ag = parseInt(ah.substring(2, 4), 16);
  const ab = parseInt(ah.substring(4, 6), 16);
  const br = parseInt(bh.substring(0, 2), 16);
  const bg = parseInt(bh.substring(2, 4), 16);
  const bb = parseInt(bh.substring(4, 6), 16);
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

export default function AnimatedGradientBackgroundBase({ children, colors }) {
  const progress = useSharedValue(0);
  const colorsRef = useRef([colors[0], colors[1]]);
  const [, setRender] = React.useState(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 6000 }), -1, true);
    const interval = setInterval(() => setRender(x => x + 1), 80);
    return () => clearInterval(interval);
  }, []);

  // グラデーション配列間をアニメーション補間
  const colorSteps = 3;
  let animatedColors = [];
  for (let i = 0; i < colorSteps; i++) {
    // 0→1を等間隔
    const t = ((progress.value + i / (colorSteps - 1)) % 1);
    // colors配列で区間判定
    const idx = Math.floor(t * (colors.length - 1));
    const tt = (t * (colors.length - 1)) - idx;
    const c1 = colors[idx];
    const c2 = colors[(idx + 1) % colors.length];
    animatedColors.push(lerpColor(c1, c2, tt));
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={animatedColors}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}