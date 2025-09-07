import React, { createContext, useContext, useState } from 'react';

// サポートする背景名をここで管理
const AVAILABLE_BACKGROUNDS = [
  { key: 'none', label: '無地', file: null },
  { key: 'cosmos', label: 'コスモス', file: require('../assets/card-backgrounds/cosmos.png') },
  // 追加例:
  // { key: 'autumn', label: '紅葉', file: require('../assets/card-backgrounds/autumn.png') },
];

const BackgroundContext = createContext();

export const BackgroundProvider = ({ children }) => {
  // デフォルトは無地
  const [selectedBackground, setSelectedBackground] = useState('none');

  // 選択中の画像オブジェクトを返す
  const getBackgroundFile = () => {
    const found = AVAILABLE_BACKGROUNDS.find(bg => bg.key === selectedBackground);
    return found?.file || null;
  };

  return (
    <BackgroundContext.Provider value={{
      selectedBackground,
      setSelectedBackground,
      getBackgroundFile,
      AVAILABLE_BACKGROUNDS,
    }}>
      {children}
    </BackgroundContext.Provider>
  );
};

// フックとして使えるように
export const useBackground = () => useContext(BackgroundContext);