// AnimatedGradientBackgroundBase.js
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// 色補間関数
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

export default function AnimatedGradientBackgroundBase({ children, colors }) {
  const progress = useSharedValue(0);
  const colorsRef = useRef([colors[0], colors[1]]);
  const [, setRender] = React.useState(0);

  useEffect(() => {
    let localProgress = 0;
    progress.value = withRepeat(withTiming(4, { duration: 16000 }), -1, false);

    const id = setInterval(() => {
      localProgress += 0.01;
      const v = localProgress % colors.length;
      const fromIndex = Math.floor(v) % colors.length;
      const toIndex = (fromIndex + 1) % colors.length;
      const frac = v - Math.floor(v);
      const colorStart = lerpColor(colors[fromIndex], colors[toIndex], frac);
      const colorEnd = lerpColor(colors[toIndex], colors[(toIndex + 1) % colors.length], frac);
      colorsRef.current = [colorStart, colorEnd];
      setRender(x => x + 1); // 強制再描画
    }, 30);

    return () => clearInterval(id);
  }, [colors]);

  return (
    <Animated.View style={[styles.absolute, { zIndex: -1 }]}>
      <LinearGradient
        colors={colorsRef.current}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={styles.absolute}
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});