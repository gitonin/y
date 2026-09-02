// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://yunma.fr';
// Sous-dossier de déploiement — utilisé pour l'aperçu GitHub Pages (ex. BASE_PATH=/y)
const base = process.env.BASE_PATH || '/';

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
      // Exclut la racine (page de redirection) et la 404 du sitemap
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/savoir-faire/') &&
        !page.includes('/a-propos/') &&
        new URL(page).pathname !== '/',
    }),
  ],
  devToolbar: { enabled: false },
});
