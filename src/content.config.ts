import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Journal — un dossier par langue : src/content/journal/{fr,en,zh}/mon-article.md
 * Le nom de fichier (slug) doit être identique dans les trois langues
 * pour que les liens hreflang se fassent automatiquement.
 */
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Yunma'),
    tags: z.array(z.string()).default([]),
    scene: z.enum(['ridges', 'terraces', 'cherries', 'canopy', 'counter', 'portrait']).default('ridges'),
    tone: z.enum(['warm', 'cool', 'deep']).default('warm'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { journal };
