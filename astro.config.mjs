import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://earnometry.com',
  output: 'static',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
});
