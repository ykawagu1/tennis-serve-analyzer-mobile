import './src/i18n';
import React from 'react';
import { LanguageProvider } from './src/contexts/LanguageContext';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // 追加

import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PermissionManager from './src/components/PermissionManager';
import { SkinProvider, useSkin } from './src/SkinContext';
import FAQScreen from './src/screens/FAQScreen'; // ← フォルダ構成に合わせて修正

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// メインタブナビゲーター
const MainTabNavigator = () => {
  const { skin } = useSkin();
  const { t } = useTranslation(); // 多言語化

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'tennis';
          else if (route.name === 'Settings') iconName = focused ? 'cog' : 'cog-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: skin.primary,
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: skin.primary },
        headerTintColor: skin.text === '#f8f8f8' ? '#f8f8f8' : '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: skin.background }
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home_title'),      // 多言語化
          tabBarLabel: t('tab_home'),  // 多言語化
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings_header'),         // 多言語化
          tabBarLabel: t('tab_settings'),      // 多言語化
        }}
      />
    </Tab.Navigator>
  );
};

// メインスタックナビゲーター
const MainStackNavigator = () => {
  const { skin } = useSkin();
  const { t } = useTranslation(); // 多言語化

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: skin.primary },
        headerTintColor: skin.text === '#f8f8f8' ? '#f8f8f8' : '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: skin.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          title: t('result_header'),      // 多言語化
          headerStyle: { backgroundColor: skin.primary },
          headerTintColor: skin.text === '#f8f8f8' ? '#f8f8f8' : '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          title: t('faq_header'),        // 多言語化
          headerStyle: { backgroundColor: skin.primary },
          headerTintColor: skin.text === '#f8f8f8' ? '#f8f8f8' : '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        }}
      />
    </Stack.Navigator>
  );
};

const SkinThemeProvider = ({ children }) => {
  const { skin } = useSkin();
  const skinTheme = {
    colors: {
      primary: skin.primary,
      accent: skin.accent,
      background: skin.background,
      surface: skin.background,
      text: skin.text,
      disabled: '#bdbdbd',
      placeholder: '#888',
      backdrop: 'rgba(0,0,0,0.4)',
    },
  };
  return <PaperProvider theme={skinTheme}>{children}</PaperProvider>;
};

export default function App() {
  return (
    <LanguageProvider>
    <SkinProvider>
      <SkinThemeProvider>
        <PermissionManager>
          <NavigationContainer>
            <StatusBar style="auto" />
            <MainStackNavigator />
            <Toast />
          </NavigationContainer>
        </PermissionManager>
      </SkinThemeProvider>
    </SkinProvider>
    </LanguageProvider>
  );
}