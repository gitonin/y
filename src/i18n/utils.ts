import fr from './fr';
import en from './en';
import zh from './zh';
import type { Dict } from './fr';

export const languages = ['fr', 'en', 'zh'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'fr';

export const dictionaries: Record<Lang, Dict> = { fr, en, zh };

export const useTranslations = (lang: Lang): Dict => dictionaries[lang] ?? dictionaries[defaultLang];

export const isLang = (value: string | undefined): value is Lang =>
  !!value && (languages as readonly string[]).includes(value);

/** Chemins canoniques (identiques dans les trois langues, préfixés par la locale). */
export const routes = {
  home: '',
  cafes: 'cafes',
  origine: 'origine',
  savoirFaire: 'savoir-faire',
  apropos: 'a-propos',
  pro: 'pro',
  journal: 'journal',
  faq: 'faq',
  contact: 'contact',
  mentions: 'mentions-legales',
  cgv: 'conditions-generales',
} as const;

export type RouteKey = keyof typeof routes;

/** Construit une URL localisée : url('fr', 'cafes') -> /fr/cafes/ */
export function url(lang: Lang, path = ''): string {
  const clean = String(path).replace(/^\/+|\/+$/g, '');
  return clean ? `/${lang}/${clean}/` : `/${lang}/`;
}

export const route = (lang: Lang, key: RouteKey) => url(lang, routes[key]);
export const productUrl = (lang: Lang, slug: string) => url(lang, `${routes.cafes}/${slug}`);
export const postUrl = (lang: Lang, slug: string) => url(lang, `${routes.journal}/${slug}`);

/** Retire le préfixe de langue d'un pathname : /fr/cafes/ -> cafes */
export function stripLang(pathname: string): string {
  return pathname.replace(/^\/(fr|en|zh)(\/|$)/, '').replace(/^\/+|\/+$/g, '');
}

/** Alternates hreflang par défaut : même chemin, autre langue. */
export function defaultAlternates(pathname: string): Record<Lang, string> {
  const rest = stripLang(pathname);
  return {
    fr: url('fr', rest),
    en: url('en', rest),
    zh: url('zh', rest),
  };
}

export function formatPrice(value: number, lang: Lang, currency = 'EUR'): string {
  const locales: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', zh: 'zh-CN' };
  return new Intl.NumberFormat(locales[lang], {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 2 : 2,
  }).format(value);
}

export function formatDate(date: Date, lang: Lang): string {
  const locales: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', zh: 'zh-CN' };
  return new Intl.DateTimeFormat(locales[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
