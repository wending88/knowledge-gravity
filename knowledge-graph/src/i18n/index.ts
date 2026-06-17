import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import zh, { type TranslationKey } from './zh';
import en from './en';

export type Lang = 'zh' | 'en';

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'zh',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'kg-language' }
  )
);

const dicts: Record<Lang, Record<TranslationKey, string>> = { zh, en };

/** Hook that subscribes to language changes and returns a translate function. */
export function useT() {
  const lang = useI18nStore((s) => s.lang);
  return (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = dicts[lang];
    let text = dict[key] ?? zh[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };
}

/** Non-reactive translate (for use outside React components, e.g. in store actions). */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const lang = useI18nStore.getState().lang;
  const dict = dicts[lang];
  let text = dict[key] ?? zh[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}
