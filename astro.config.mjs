import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://earnometry.com',
  output: 'static',
  trailingSlash: 'never',
  // Cloudflare Pages serves .html files at extensionless, slash-free URLs.
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
