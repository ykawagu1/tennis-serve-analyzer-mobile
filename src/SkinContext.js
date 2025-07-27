import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 各スキンに「premiumOnly」属性を追加
export const SKINS = [
  { key: 'classic', name: 'シンプル', primary: '#1976d2', background: '#f5f5f5', text: '#222', accent: '#4caf50', premiumOnly: false },
  { key: 'genz', name: 'ポップ', primary: '#ff69b4', background: '#fff0f6', text: '#333', accent: '#ffde59', premiumOnly: false },
  { key: 'dark', name: 'アース', primary: '#78866b', background: '#f4f4e6', text: '#2e3a24', accent: '#b7b37a', premiumOnly: false },
  { key: 'mint', name: 'ミント', primary: '#30cfcf', background: '#e0f7fa', text: '#333', accent: '#009688', premiumOnly: false },
  { key: 'retro', name: 'レトロ', primary: '#ff9800', background: '#fff8e1', text: '#5d4037', accent: '#ff5722', premiumOnly: false },
  // プレミアム専用
  { key: 'gradient-blue', name: 'Blue Gradient',
    primary: '#2193b0', background: '#e3f0ff', text: '#16324f', accent: '#6dd5ed',
    premiumOnly: true,
    gradient: ['#2193b0', '#6dd5ed', '#00e1ff', '#66ff99'] // お好みで
  },
  // ここを追加！
  { key: 'gradient-red', name: 'Red Gradient',
    primary: '#ff1744', background: '#fff8f7', text: '#311b1b', accent: '#ff9800',
    premiumOnly: true,
    gradient: ['#ff1744', '#ff9800', '#f44336', '#ffd600', '#9c27b0'] // 赤、オレンジ、紫、黄色など
  },
  {
      key: 'gradient-night',
      name: 'Night Sky Gradient',
      primary: '#232526',
      background: '#414345',
      text: '#f8f8f8',
      accent: '#363795',
      premiumOnly: true,
      gradient: ['#232526', '#414345', '#005c97', '#363795'],
    },
    {
      key: 'gradient-rainbow',
      name: 'Rainbow Gradient',
      primary: '#ff6e7f',
      background: '#f7ff00',
      text: '#232526',
      accent: '#43cea2',
      premiumOnly: true,
      gradient: [
        '#ff6e7f', '#bfe9ff', '#f7ff00', '#43cea2',
        '#185a9d', '#a8ff78', '#f7971e'
      ],
    },
  {
    key: 'gradient-gold',
    name: 'Gold Gradient',
    primary: '#f7971e',
    background: '#fff6b7',
    text: '#795548',
    accent: '#ffd200',
    premiumOnly: true,
    gradient: ['#f7971e', '#ffd200', '#fff6b7', '#fff'],
  },



];

export const SkinContext = createContext({
  skin: SKINS[0],
  skinKey: SKINS[0].key,
  setSkinKey: () => {},
  isPremium: false,
  setIsPremium: () => {},
  skins: SKINS,
});

export const SkinProvider = ({ children }) => {
  const [skinKey, setSkinKey] = useState(SKINS[0].key);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    (async () => {
      const savedSkin = await AsyncStorage.getItem('selectedSkin');
      if (savedSkin) setSkinKey(savedSkin);
      const savedPremium = await AsyncStorage.getItem('isPremium');
      setIsPremium(savedPremium === 'true');
    })();
  }, []);

  const setAndStoreSkinKey = async (key) => {
    setSkinKey(key);
    await AsyncStorage.setItem('selectedSkin', key);
  };

  const setAndStorePremium = async (val) => {
    setIsPremium(val);
    await AsyncStorage.setItem('isPremium', val ? 'true' : 'false');
  };

  const skin = SKINS.find(s => s.key === skinKey) || SKINS[0];

  // スキン色テーマオブジェクト（拡張可）
  const skinStyle = {
    background: { backgroundColor: skin.background },
    title: { color: skin.primary },
    subtitle: { color: '#666' },
    card: { backgroundColor: skin.background },
    cardTitle: { color: skin.primary },
    cardDescription: { color: '#666' },
    errorCard: { backgroundColor: '#ffebee' },
    errorText: { color: '#c62828' },
    // 追加でgradientや他の属性をskinから参照してもOK
  };

  return (
    <SkinContext.Provider value={{
      skin, skinKey, setSkinKey: setAndStoreSkinKey,
      isPremium, setIsPremium: setAndStorePremium,
      skins: SKINS, skinStyle
    }}>
      {children}
    </SkinContext.Provider>
  );
};

export const useSkin = () => useContext(SkinContext);