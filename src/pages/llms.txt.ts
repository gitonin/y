import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { products } from '../data/products';
import { SITE } from '../consts';
import { dictionaries, languages, type Lang } from '../i18n/utils';

/**
 * /llms.txt — résumé structuré du site pour les moteurs de réponse et les IA
 * (ChatGPT, Claude, Perplexity…). Format inspiré de llmstxt.org.
 */
export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://yunma.fr')).origin;
  const t = dictionaries.fr;

  const posts = (await getCollection('journal'))
    .filter((p) => p.id.startsWith('fr/') && !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  push(
    '# Yunma',
    '',
    `> ${t.home.seoDescription}`,
    '',
    "Yunma est un torréfacteur français spécialisé dans les cafés de spécialité du Yunnan (Chine). La marque achète en direct auprès de trois fermes partenaires — Torch Estate à Pu'er, Yun Lan Estate à Xishuangbanna et la ferme de Gaoshen à Baoshan — entre 1 300 et 1 800 mètres d'altitude, et torréfie en petites séries. Le site est disponible en français, anglais et chinois simplifié. Le paiement et l'expédition sont opérés par Shopify.",
    '',
    '## Informations clés',
    '',
    `- Nom : ${SITE.name}`,
    `- Activité : sélection, importation et torréfaction de cafés de spécialité du Yunnan`,
    `- Origine des cafés : Yunnan, Chine (Baoshan, Pu'er, Xishuangbanna), altitude 1 300–1 800 m`,
    `- Première récolte importée : ${SITE.founded}`,
    `- Adresse : ${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}, France`,
    `- Contact : ${SITE.email} — professionnels : ${SITE.proEmail} — ${SITE.phone}`,
    `- Livraison : France 2–3 jours ouvrés, Union européenne 3–6 jours ouvrés, offerte dès ${SITE.freeShippingFrom} € en France métropolitaine`,
    `- Langues : ${languages.map((l) => dictionaries[l].meta.label).join(', ')}`,
    '',
    '## Produits',
    ''
  );

  for (const product of products) {
    const price = Math.min(...product.variants.map((v) => v.price));
    push(
      `- [${product.name.fr}](${origin}/fr/cafes/${product.slug}/) — ${product.subtitle.fr}, ${price.toFixed(2)} € · ${product.variants
        .map((v) => v.label.fr)
        .join(', ')} · ${product.specs.process.fr} · notes : ${product.specs.notes.fr} · ${product.short.fr}`
    );
  }

  push('', '## Pages principales (français)', '');
  // La page Origine réunit le terroir, l'histoire de la marque et le savoir-faire.
  const pages: [string, string, string][] = [
    ['Accueil', '/fr/', t.home.seoDescription],
    ['Nos cafés', '/fr/cafes/', t.cafes.seoDescription],
    ['Origine, histoire et savoir-faire', '/fr/origine/', t.origine.seoDescription],
    ['Espace professionnels', '/fr/pro/', t.pro.seoDescription],
    ['Journal', '/fr/journal/', t.journal.seoDescription],
    ['FAQ', '/fr/faq/', t.faq.seoDescription],
    ['Contact', '/fr/contact/', t.contact.seoDescription],
  ];
  for (const [name, path, description] of pages) push(`- [${name}](${origin}${path}) : ${description}`);

  push('', '## Versions linguistiques', '');
  const alt: Record<Lang, string> = { fr: 'Français', en: 'English', zh: '简体中文' };
  for (const code of languages) push(`- ${alt[code]} : ${origin}/${code}/`);

  push('', '## Journal', '');
  for (const post of posts) {
    push(
      `- [${post.data.title}](${origin}/fr/journal/${post.id.split('/').slice(1).join('/')}/) — ${post.data.description}`
    );
  }

  push('', '## Questions fréquentes', '');
  for (const item of t.faq.items) push(`- ${item.q} ${item.a}`);

  push('', '## Optional', '', `- [Sitemap](${origin}/sitemap-index.xml)`, '');

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
