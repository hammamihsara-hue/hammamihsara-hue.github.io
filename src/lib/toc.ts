/** The book's single source of truth for its own pagination. */
export const TOTAL_FOLIOS = 14;

export interface TocEntry {
  href: string;
  label: string;
  note?: string;
  folio: number;
}

export const TOC: TocEntry[] = [
  { href: '/works/on-breathing-underwater', label: 'ON BREATHING UNDERWATER', folio: 2 },
  { href: '/works/chasing-the-sun', label: 'CHASING THE SUN', note: 'enamorado con el sol —', folio: 3 },
  { href: '/works/an-early-summer-heaven', label: 'early summer heaven', folio: 6 },
  { href: '/works/entangled-anemones', label: 'entangled anemones', folio: 9 },
  { href: '/published-works', label: 'published works', folio: 11 },
  { href: '/cv', label: 'CV', folio: 14 },
];

/** Reading order for page-turning (arrow keys / swipe): cover, then contents. */
export const BOOK_ORDER: string[] = ['/', ...TOC.map((t) => t.href)];
