import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://earnometry.com',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'never',
  // GitHub Pages serves file-format output at these clean, extensionless URLs.
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
