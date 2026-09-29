// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// GitHub Pages のプロジェクトサイトとして公開する（リポジトリ名 = base）
export default defineConfig({
  site: 'https://mizuki-majima.github.io',
  base: '/home_selection',
  trailingSlash: 'always',
  integrations: [svelte(), sitemap()],
  // CSS は小さいので HTML に埋め込み、描画を止めるリクエストをなくす
  build: { inlineStylesheets: 'always' },
});
