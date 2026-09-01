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

/**
 * Préfixe de déploiement : '/' en production, '/y/' pour un aperçu GitHub Pages
 * (défini par la variable d'environnement BASE_PATH au build).
 */
export const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Chemin d'un fichier de `public/`, préfixé si le site est servi dans un sous-dossier. */
export const asset = (path: string) => `${BASE}${path.replace(/^\/+/, '')}`;

/** URL absolue d'un chemin interne (données structurées, Open Graph…). */
export const absolute = (site: URL | undefined, path: string) =>
  new URL(asset(path), site ?? new URL('https://yunma.fr')).href;

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
  return clean ? `${BASE}${lang}/${clean}/` : `${BASE}${lang}/`;
}

export const route = (lang: Lang, key: RouteKey) => url(lang, routes[key]);
export const productUrl = (lang: Lang, slug: string) => url(lang, `${routes.cafes}/${slug}`);
export const postUrl = (lang: Lang, slug: string) => url(lang, `${routes.journal}/${slug}`);

/** Retire le préfixe de déploiement et de langue : /y/fr/cafes/ -> cafes */
export function stripLang(pathname: string): string {
  const withoutBase = pathname.startsWith(BASE) ? `/${pathname.slice(BASE.length)}` : pathname;
  return withoutBase.replace(/^\/(fr|en|zh)(\/|$)/, '').replace(/^\/+|\/+$/g, '');
}

/** Alternates hreflang par défaut : même chemin, autre langue. */
export function defaultAlternates(pathname: string): Record<Lang, string> {
  // La page 404 n'existe pas par langue : on renvoie vers les accueils.
  const rest = stripLang(pathname) === '404' ? '' : stripLang(pathname);
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
