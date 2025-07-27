import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const COLORS = [
  '#80d8ff', // 空色
  '#1976d2', // 青
  '#00bfae', // 緑
  '#d4ff37', // ライム
];

// b → blue に変えてバグ回避
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

export default function AnimatedGradientBackground({ children }) {
  const progress = useSharedValue(0);
  const colorsRef = useRef([COLORS[0], COLORS[1]]);
  const [, setRender] = React.useState(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(4, { duration: 16000 }), -1, false);

    const id = setInterval(() => {
      const v = progress.value;
      const fromIndex = Math.floor(v) % COLORS.length;
      const toIndex = (fromIndex + 1) % COLORS.length;
      const frac = v - Math.floor(v);
      const colorStart = lerpColor(COLORS[fromIndex], COLORS[toIndex], frac);
      const colorEnd = lerpColor(COLORS[toIndex], COLORS[(toIndex + 1) % COLORS.length], frac);
      colorsRef.current = [colorStart, colorEnd];
      setRender(x => x + 1);
    }, 30);

    return () => clearInterval(id);
  }, []);

  return (
    <Animated.View style={[styles.absolute, { zIndex: -1 }]}>
      <LinearGradient
        colors={colorsRef.current}
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 1.0, y: 1.0 }}
        style={styles.absolute}
      />
      <>{children}</>
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