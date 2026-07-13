// @ts-check
import { defineConfig } from 'astro/config';

// Static portfolio for Sara H. Hammami — "the site is a book".
export default defineConfig({
  site: 'https://www.sarahhamm.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
