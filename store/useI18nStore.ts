import { create } from 'zustand';
import { Language, dictionaries } from '../lib/i18n/dictionaries';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  language: 'ru',
  setLanguage: (lang) => set({ language: lang }),
  t: (path: string) => {
    const { language } = get();
    const keys = path.split('.');
    let current: any = dictionaries[language];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return path; // Fallback to key
      }
      current = current[key];
    }
    
    return current;
  }
}));
