/**
 * Flux de produits pour Google Merchant Center.
 *
 * Google relit ce fichier à l'adresse https://yunma.fr/flux-google.xml, aussi
 * souvent qu'on le lui demande. Rien à téléverser à la main, rien à tenir à
 * jour deux fois : les prix, les libellés et les disponibilités sont ceux de
 * `contenu/produits.json`, c'est-à-dire ceux du site.
 *
 * Le format est celui que Google attend — RSS 2.0 et l'espace de noms `g:`.
 *
 * Attention : la disponibilité vient du fichier de contenu, non de Shopify.
 * Un café épuisé chez Shopify restera annoncé « in_stock » ici tant que
 * `available` n'aura pas été mis à false et le site reconstruit. Google
 * sanctionne un prix ou un stock faux : c'est le point à surveiller.
 */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { products, defaultVariant } from '../data/products';
import { getPackshot } from '../data/packshots';
import { SITE } from '../consts';
import { productUrl } from '../i18n/utils';

/** `&` et consorts cassent un XML : on les remplace avant de les y poser. */
const echapper = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://yunma.fr');
  const abs = (chemin: string) => new URL(chemin.replace(/^\//, ''), base).href;

  /* Le flux est français : c'est le marché déclaré au compte Merchant. Une
     autre langue demanderait un second flux et un second pays cible. */
  const lang = 'fr' as const;

  const articles = await Promise.all(
    products.map(async (p) => {
      const v = defaultVariant(p);
      const packshot = getPackshot(p.slug);
      /* Google veut une photographie du produit, en JPEG ou PNG — pas de WebP
         dans un flux, et pas le visuel de partage générique. */
      const image = packshot
        ? abs((await getImage({ src: packshot.src, width: 1200, format: 'png' })).src)
        : abs('og/yunma-og.png');

      /* Un descriptif propre au flux : celui de la fiche, débarrassé de sa
         mise en forme, complété du terroir et de la variété — ce sont les mots
         par lesquels on cherche un café de spécialité. */
      const description = [
        p.description[lang],
        `Origine : ${p.specs.origin[lang]}.`,
        `Variété : ${p.specs.variety[lang]}.`,
        `Notes : ${p.specs.notes[lang]}.`,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        id: p.sku,
        title: `${p.name[lang]} — ${p.subtitle[lang]}`,
        description,
        link: abs(productUrl(lang, p.slug)),
        image_link: image,
        availability: v.available ? 'in_stock' : 'out_of_stock',
        price: `${v.price.toFixed(2)} EUR`,
        brand: SITE.name,
        condition: 'new',
        /* Sans code-barres ni référence fabricant — nos lots sont conditionnés
           en petites séries —, Google demande de le déclarer explicitement.
           Taire l'un et l'autre sans le dire fait rejeter l'article. */
        identifier_exists: 'no',
        mpn: p.sku,
        product_type: { grain: 'Café en grains', drip: 'Sachets filtres', set: 'Coffrets' }[p.category],
        /* 1912 : « Aliments, boissons et tabac > Boissons > Café ». */
        google_product_category: '1912',
        shipping_weight: `${v.weightGrams} g`,
        /* Les frais de port ne sont pas déclarés ici : ils dépendent du
           montant du panier — offerts à partir de 50 € — et un flux ne sait
           pas exprimer un seuil. On les règle une fois pour toutes dans le
           compte Merchant, qui sait le faire ; les annoncer à 0 € pour tout
           le monde serait faux, et Google sanctionne un prix faux. */
      };
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${echapper(SITE.name)}</title>
    <link>${base.origin}</link>
    <description>Cafés de spécialité du Yunnan, torréfiés à Paris.</description>
${articles
  .map(
    (a) => `    <item>
      <g:id>${echapper(a.id)}</g:id>
      <g:title>${echapper(a.title)}</g:title>
      <g:description>${echapper(a.description)}</g:description>
      <g:link>${echapper(a.link)}</g:link>
      <g:image_link>${echapper(a.image_link)}</g:image_link>
      <g:availability>${a.availability}</g:availability>
      <g:price>${a.price}</g:price>
      <g:brand>${echapper(a.brand)}</g:brand>
      <g:condition>${a.condition}</g:condition>
      <g:identifier_exists>${a.identifier_exists}</g:identifier_exists>
      <g:mpn>${echapper(a.mpn)}</g:mpn>
      <g:product_type>${echapper(a.product_type)}</g:product_type>
      <g:google_product_category>${a.google_product_category}</g:google_product_category>
      <g:shipping_weight>${a.shipping_weight}</g:shipping_weight>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
