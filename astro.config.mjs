// @ts-check
import { defineConfig } from 'astro/config';

// Static portfolio for Sara H. Hammami — "the site is a book".
// Set `site` to the real domain before wiring up a deploy.
export default defineConfig({
  site: 'https://sarahammami.example',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
