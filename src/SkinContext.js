// src/SkinContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// スキン名は「nameKey」で（多言語対応のため！）
export const SKINS = [
  { key: 'classic', nameKey: 'skin_simple', primary: '#1976d2', background: '#f5f5f5', text: '#222', accent: '#4caf50', premiumOnly: false },
  { key: 'genz', nameKey: 'skin_genz', primary: '#ff69b4', background: '#fff0f6', text: '#333', accent: '#ffde59', premiumOnly: false },
  { key: 'dark', nameKey: 'skin_earth', primary: '#78866b', background: '#f4f4e6', text: '#2e3a24', accent: '#b7b37a', premiumOnly: false },
  { key: 'mint', nameKey: 'skin_mint', primary: '#30cfcf', background: '#e0f7fa', text: '#333', accent: '#009688', premiumOnly: false },
  { key: 'retro', nameKey: 'skin_retro', primary: '#ff9800', background: '#fff8e1', text: '#5d4037', accent: '#ff5722', premiumOnly: false },
  // プレミアム専用
  {
    key: 'gradient-blue', nameKey: 'skin_gradient_blue', primary: '#2193b0', background: '#e3f0ff', text: '#16324f', accent: '#6dd5ed', premiumOnly: true,
    gradient: ['#2193b0', '#6dd5ed', '#00e1ff', '#66ff99']
  },
   {
    key: 'gradient-red', nameKey: 'skin_gradient_red', primary: '#ff1744', background: '#fff8f7', text: '#311b1b', accent: '#ff9800', premiumOnly: true,
    gradient: ['#ff1744', '#ff9800', '#f44336', '#ffd600', '#9c27b0']
  },
  {
    key: 'gradient-purple', nameKey: 'skin_gradient_purple', primary: '#9c27b0', background: '#f3e5f5', text: '#4a148c', accent: '#ce93d8', premiumOnly: true,
    gradient: ['#9c27b0', '#673ab7', '#512da8', '#9575cd']
  },
  {
    key: 'gradient-green', nameKey: 'skin_gradient_green', primary: '#43cea2', background: '#e0f2f1', text: '#1b5e20', accent: '#00bfa5', premiumOnly: true,
    gradient: ['#43cea2', '#185a9d', '#00c853', '#a8e063']
  },
  {
    key: 'gradient-sunset', nameKey: 'skin_gradient_sunset', primary: '#ff7e5f', background: '#fff3e0', text: '#4e342e', accent: '#feb47b', premiumOnly: true,
    gradient: ['#ff7e5f', '#feb47b', '#fd746c', '#ffcc70']
  },
  {
    key: 'gradient-rainbow', nameKey: 'skin_gradient_rainbow', primary: '#ff6e7f', background: '#fffde7', text: '#232526', accent: '#43cea2', premiumOnly: true,
    gradient: ['#ff5f6d', '#ffc371', '#47cf73', '#3c9ee7', '#a259c1']
  },
  {
    key: 'gradient-neon', nameKey: 'skin_gradient_neon', primary: '#00fff0', background: '#1a0037', text: '#fff', accent: '#ff00ea', premiumOnly: true,
    gradient: ['#00fff0', '#ff00ea', '#2300ff', '#00ffe7', '#00ffae', '#f8ff00', '#ff1d77']
  },
  {
    key: 'gradient-strobe', nameKey: 'skin_gradient_strobe', primary: '#fff600', background: '#111', text: '#ff0000', accent: '#00ffea', premiumOnly: true,
    gradient: ['#fff600', '#ff0000', '#00ffea', '#ff00ec', '#fff', '#000']
  },
  {
    key: 'gradient-aurora', nameKey: 'skin_gradient_aurora', primary: '#00ffc8', background: '#161e2c', text: '#fff', accent: '#ffff1c', premiumOnly: true,
    gradient: ['#00c3ff', '#ffff1c', '#00ffc8', '#ff61a6', '#293462']
  },
  {
    key: 'gradient-candy', nameKey: 'skin_gradient_candy', primary: '#fcb69f', background: '#fff5ef', text: '#333', accent: '#a1c4fd', premiumOnly: true,
    gradient: ['#ffecd2', '#fcb69f', '#a1c4fd', '#c2e9fb']
  },
];

// Context作成
export const SkinContext = createContext({
  skin: SKINS[0],
  skinKey: SKINS[0].key,
  setSkinKey: () => {},
  isPremium: false,
  setIsPremium: () => {},
  skins: SKINS,
});

// Provider
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

  const skinStyle = {
    background: { backgroundColor: skin.background },
    title: { color: skin.primary },
    subtitle: { color: '#666' },
    card: { backgroundColor: skin.background },
    cardTitle: { color: skin.primary },
    cardDescription: { color: '#666' },
    errorCard: { backgroundColor: '#ffebee' },
    errorText: { color: '#c62828' },
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