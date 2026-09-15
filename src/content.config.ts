import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { photoNames } from './data/photos';

/**
 * Journal — un dossier par langue : contenu/journal/{fr,en,zh}/mon-article.md
 * Déposer un fichier suffit à publier un article ; aucune autre modification
 * n'est nécessaire. Le nom de fichier (slug) doit être identique dans les
 * trois langues pour que les liens hreflang se fassent automatiquement.
 */
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './contenu/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Yunma'),
    tags: z.array(z.string()).default([]),
    /** Photographie d'en-tête : une clé de src/data/photos.ts */
    photo: z
      .enum(photoNames)
      .default('cretes-brumeuses'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { journal };
