export const SITE = {
  name: 'Yunma',
  legalName: 'Yunma',
  domain: 'yunma.fr',
  url: import.meta.env.SITE || 'https://yunma.fr',
  email: 'hello@yunma.fr',
  proEmail: 'pro@yunma.fr',
  pressEmail: 'presse@yunma.fr',
  phone: '+33 6 42 05 04 58',
  phoneHref: '+33642050458',
  address: {
    street: '1 rue Ordener',
    postalCode: '75018',
    city: 'Paris',
    country: 'FR',
  },
  social: {
    instagram: 'https://www.instagram.com/yunma.coffee/',
    linkedin: 'https://www.linkedin.com/company/yunma/',
  },
  currency: 'EUR',
  freeShippingFrom: 50,
  founded: '2019',
};

/** Shopify — renseigner les variables d'environnement (voir .env.example). */
export const SHOPIFY = {
  domain: import.meta.env.PUBLIC_SHOPIFY_DOMAIN || '',
  token: import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '',
  accountUrl: import.meta.env.PUBLIC_SHOPIFY_ACCOUNT_URL || '',
};
