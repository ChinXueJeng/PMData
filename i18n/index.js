import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import zh from './locales/zh.json';

// Initialize i18n
const initI18n = async () => {
  // Default to 'en' if we can't determine the language
  let savedLanguage = 'en';
  
  try {
    // Try to get saved language from storage
    const storedLanguage = await AsyncStorage.getItem('user-language');
    if (storedLanguage) {
      savedLanguage = storedLanguage;
    } else {
      // Fall back to device language if available
      const deviceLanguage = Localization.locale || 'en';
      savedLanguage = deviceLanguage.split('-')[0]; // Get base language code
    }
  } catch (error) {
    console.error('Error getting language:', error);
    // Fall back to 'en' if there's an error
    savedLanguage = 'en';
  }

  // Ensure we only use 'en' or 'zh'
  if (savedLanguage !== 'en' && savedLanguage !== 'zh') {
    savedLanguage = 'en';
  }

  // Initialize i18n
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        zh: { translation: zh }
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    });

  return i18n;
};

// Function to change language
const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem('user-language', language);
  } catch (error) {
    console.error('Error changing language:', error);
    throw error;
  }
};

// Initialize and export
export { changeLanguage, initI18n };
export default i18n;