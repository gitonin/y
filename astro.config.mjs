// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://yunma.fr';
// Sous-dossier de déploiement — utilisé pour l'aperçu GitHub Pages (ex. BASE_PATH=/y)
const base = process.env.BASE_PATH || '/';
// Le même préfixe, toujours terminé par une barre, pour découper les chemins.
const prefixe = base.endsWith('/') ? base : `${base}/`;

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    locales: ['fr', 'en', 'zh'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-FR', en: 'en', zh: 'zh-Hans' },
      },
      /* Le plan du site ne recense que les vraies pages. En sont écartées la
         404, la planche de travail, deux pages tenues hors index — et toutes
         les passerelles Shopify, qui ne sont que des renvois.

         Ces dernières se distinguent par leur place : /journal/ est une
         passerelle, /fr/journal/ est la vraie page. On raisonne donc sur le
         chemin débarrassé du sous-dossier de déploiement, jamais par simple
         inclusion — `includes('/journal/')` écarterait les deux. */
      filter: (page) => {
        const chemin = new URL(page).pathname.slice(prefixe.length);
        if (chemin === '') return false;
        if (chemin === 'journal/') return false;
        if (chemin.startsWith('products/')) return false;
        if (chemin.startsWith('collections/')) return false;
        return (
          !chemin.includes('404') &&
          !chemin.includes('composants/') &&
          !chemin.includes('savoir-faire/') &&
          !chemin.includes('a-propos/')
        );
      },
    }),
  ],
  devToolbar: { enabled: false },
});
