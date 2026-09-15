import type { PhotoName } from './photos';
import contenu from '../../contenu/produits.json';

export type Lang = 'fr' | 'en' | 'zh';
export type L = Record<Lang, string>;

export type Variant = {
  /** ID de variante Shopify (Storefront API, format gid://shopify/ProductVariant/...) */
  shopifyVariantId: string;
  label: L;
  price: number;
  weightGrams: number;
  available: boolean;
};

export type Product = {
  slug: string;
  sku: string;
  category: 'grain' | 'drip' | 'set';
  visual: 'bag-01' | 'bag-03' | 'bag-05' | 'box' | 'bundle';
  /** Handle produit Shopify (utile pour les liens directs et le SAV) */
  shopifyHandle: string;
  shopifyProductId: string;
  variants: Variant[];
  name: L;
  lot: string;
  subtitle: L;
  short: L;
  description: L;
  story: L;
  /** Reprend les mentions portées sur l'étiquette du sachet. */
  specs: {
    origin: L;
    altitude: L;
    variety: L;
    process: L;
    notes: L;
    drying: L;
    harvest: L;
    /** Profil : filtre ou espresso, comme indiqué sur l'étiquette.
        Absent d'un assortiment, qui mêle plusieurs torréfactions. */
    roast?: L;
  };
  brew: L;
  includes?: L[];
  /** Photographie d'ambiance, en pleine largeur au-dessus du récit de la fiche. */
  ambiance: PhotoName;
  /** Ferme productrice, présentée directement sur la fiche produit. */
  farm: {
    name: string;
    place: L;
    text: L;
    photo: PhotoName;
  };
  related: string[];
};

/* Les fermes et les produits ne vivent plus ici mais dans
   `contenu/produits.json`, à la racine du projet : ce fichier-là se modifie
   et se téléverse sans toucher au code. Chaque produit y désigne sa ferme par
   une clé, et peut lui donner un autre nom d'affichage avec `fermeNom`. */
type FermeJson = { nom: string; place: L; text: L; photo: string };
type ProduitJson = Omit<Product, 'farm'> & { ferme: string; fermeNom?: string };

const { fermes, produits } = contenu as unknown as {
  fermes: Record<string, FermeJson>;
  produits: ProduitJson[];
};

export const products: Product[] = produits.map(({ ferme, fermeNom, ...reste }) => {
  const source = fermes[ferme];
  if (!source) throw new Error(`contenu/produits.json : le produit « ${reste.slug} » renvoie à la ferme inconnue « ${ferme} ».`);
  return {
    ...reste,
    farm: { name: fermeNom ?? source.nom, place: source.place, text: source.text, photo: source.photo as PhotoName },
  };
});

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const fromPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
export const toPrice = (p: Product) => Math.max(...p.variants.map((v) => v.price));
/** Vrai quand les variantes n'ont pas toutes le même prix : le catalogue affiche « à partir de ». */
export const hasPriceRange = (p: Product) => fromPrice(p) !== toPrice(p);
/** Variante proposée par défaut : la première encore disponible. */
export const defaultVariant = (p: Product) => p.variants.find((v) => v.available) ?? p.variants[0];
/** Position de cette variante dans la liste — sert de clé stable, indépendante de la langue. */
export const variantIndex = (p: Product, variant: Variant) => p.variants.indexOf(variant);
