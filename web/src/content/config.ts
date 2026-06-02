import { defineCollection, z } from 'astro:content';

// Stories-Collection (Stufe 1, Option A: Bodies im Frontmatter).
// Felder spiegeln content/stories/*.md. Markdown-Body bleibt leer.
const stories = defineCollection({
  type: 'content',
  schema: z.object({
    title_de: z.string().default(''),
    category_de: z.string().default(''),
    date: z.string().default(''),
    cover: z.string().default(''),
    excerpt_de: z.string().default(''),
    body_de: z.string().default(''),
    has_english: z.boolean().default(false),
    title_en: z.string().default(''),
    category_en: z.string().default(''),
    excerpt_en: z.string().default(''),
    body_en: z.string().default(''),
    youtube_url: z.string().optional().default(''),
    gallery: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { stories };
