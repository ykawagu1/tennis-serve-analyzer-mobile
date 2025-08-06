import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import i18n from '../i18n';  // ←これを必ずimport！

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' }
];

export default function LanguageSwitcher() {
  // i18n.languageは「en-US」や「ja-JP」になることがあるので、2文字に揃える
  const [selected, setSelected] = useState(i18n.language?.substring(0,2) || 'en');

  const handlePress = (langCode) => {
    setSelected(langCode);
    i18n.changeLanguage(langCode); // これが大事！！
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map(lang => (
        <Pressable
          key={lang.code}
          onPress={() => handlePress(lang.code)}
          style={({ pressed }) => [
            styles.button,
            selected === lang.code && styles.selectedButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text style={styles.label}>{lang.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  button: {
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(240,240,240,0.1)',
    paddingVertical: 1,
    paddingHorizontal: 2,
    minWidth: 36
  },
  selectedButton: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd'
  },
  flag: {
    fontSize: 26,
    textAlign: 'center',
  },
  label: {
    fontSize: 9,
    color: '#444',
    textAlign: 'center',
    marginTop: 0,
    lineHeight: 11,
  }
});