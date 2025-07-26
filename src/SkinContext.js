import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SKINS = [
  { key: 'classic', name: 'シンプル', primary: '#1976d2', background: '#f5f5f5', text: '#222', accent: '#4caf50' },
  { key: 'genz', name: 'Z世代ポップ', primary: '#ff69b4', background: '#fff0f6', text: '#333', accent: '#ffde59' },
  { key: 'dark', name: 'ダーク', primary: '#222831', background: '#11151c', text: '#f8f8f8', accent: '#4f8cff' },
  { key: 'mint', name: 'ミント', primary: '#30cfcf', background: '#e0f7fa', text: '#333', accent: '#009688' },
  { key: 'retro', name: 'レトロ', primary: '#ff9800', background: '#fff8e1', text: '#5d4037', accent: '#ff5722' },
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

  // スキン色テーマオブジェクトを生成（必要に応じて拡張）
  const skinStyle = {
    background: { backgroundColor: skin.background },
    title: { color: skin.primary },
    subtitle: { color: '#666' },
    card: { backgroundColor: skin.background },
    cardTitle: { color: skin.primary },
    cardDescription: { color: '#666' },
    errorCard: { backgroundColor: '#ffebee' },
    errorText: { color: '#c62828' },
    // ...必要に応じて追加
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
