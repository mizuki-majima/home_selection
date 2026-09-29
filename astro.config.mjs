// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

// GitHub Pages のプロジェクトサイトとして公開する（リポジトリ名 = base）
export default defineConfig({
  site: 'https://mizuki-majima.github.io',
  base: '/home_selection',
  trailingSlash: 'always',
  integrations: [
    svelte(),
    // 旧URLの案内ページ（src/pages/chapters/[old].astro）はサイトマップに載せない
    sitemap({ filter: (page) => !/\/chapters\/(01-options|02-money|03-land|04-tradeoff|05-structure|06-performance|07-builders)\//.test(page) }),
  ],
  // CSS は小さいので HTML に埋め込み、描画を止めるリクエストをなくす
  build: { inlineStylesheets: 'always' },
});
