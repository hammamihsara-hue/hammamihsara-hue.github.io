import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Each work is a folder in src/content/works/<slug>/ holding:
 *   index.md    — frontmatter below + the project statement as the body
 *   plate-*.jpg — photographs (referenced relative to index.md)
 *   poems/*.txt — poems, whitespace-faithful (the txt IS the layout;
 *                 replace a txt file to correct a poem's formatting)
 */
const works = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/works' }),
  schema: ({ image }) => {
    const leafPlate = z.object({
      kind: z.literal('plate'),
      src: image(),
      alt: z.string(),
      caption: z.string().optional(),
      wide: z.boolean().default(false),
      light: z.boolean().default(false),
      duet: z.boolean().default(false),
    });

    const leafPoem = z.object({
      kind: z.literal('poem'),
      file: z.string(),
      label: z.string().optional(),
      mode: z.enum(['spatial', 'prose', 'overprint', 'recipe']).default('spatial'),
      align: z.enum(['left', 'right']).default('left'),
      titleParts: z
        .array(z.object({ text: z.string(), tone: z.string().optional() }))
        .optional(),
    });

    const leafNote = z.object({
      kind: z.literal('note'),
      text: z.string(),
    });

    const leafVideo = z.object({
      kind: z.literal('video'),
      src: z.string(),
      label: z.string(),
      caption: z.string().optional(),
      autoplay: z.boolean().default(true),
      loop: z.boolean().default(true),
      muted: z.boolean().default(true),
    });

    const leafDocument = z.object({
      kind: z.literal('document'),
      src: z.string(),
      label: z.string(),
      meta: z.string().optional(),
    });

    return z.object({
      title: z.string(),
      eyebrow: z.string().optional(),
      year: z.string(),
      media: z.string(),
      order: z.number(),
      folioStart: z.number(),
      folioEnd: z.number(),
      uncut: z.boolean().default(false),
      tone: z.enum(['dark', 'bright']).default('dark'),
      accent: z.enum(['thread', 'rice']).default('thread'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      coverLight: z.boolean().default(true),
      epigraph: z.string().optional(),
      epigraphCite: z.string().optional(),
      exhibited: z.string().optional(),
      leaves: z
        .array(
          z.discriminatedUnion('kind', [
            leafPlate,
            leafPoem,
            leafNote,
            leafVideo,
            leafDocument,
          ])
        )
        .default([]),
    });
  },
});

export const collections = { works };
