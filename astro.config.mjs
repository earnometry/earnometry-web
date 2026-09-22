import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://earnometry.com',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'never',
  // Cloudflare Pages serves .html files at extensionless, slash-free URLs.
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
