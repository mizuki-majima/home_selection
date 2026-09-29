# HOUSE NOTE — 家を選ぶ前に、図で読む

住宅購入（主に新築一戸建て・注文住宅）を検討する人のための図解サイトです。8章・図解22点。やさしい話（STEP 1）からくわしい話（STEP 3）へ順に読めるように並べ、各章も「ひとことで言うと＋やさしい図」→ ポイント → ふつうの図 → くわしい図 の順にしています。

| STEP | 章 |
|---|---|
| 1 まず全体をつかむ（やさしい） | 01 家を買うタイミングと流れ／02 家の種類／03 木造・鉄骨のちがい |
| 2 選び方を知る（ふつう） | 04 住宅会社の選び方／05 お金の計画 |
| 3 くわしく比べる（むずかしい） | 06 土地選び／07 土地と建物のバランス／08 住宅性能 |

- 設計書：`docs/superpowers/specs/2026-09-29-house-note-design.md`
- 章別コンテンツ設計書（載せる事実・出典の正本）：`docs/superpowers/specs/2026-09-29-house-note-content-brief.md`

## 技術

Astro 5 ＋ Svelte 5（触って動く図）＋ GSAP ScrollTrigger（スクロール図）＋ 手書き SVG。フォントはしっぽり明朝を、サイトで使う文字だけにサブセット化して自己配信しています（`public/fonts/`）。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm install` | 依存パッケージを入れる |
| `npm run dev` | 開発サーバー（http://localhost:4321/home_selection/） |
| `npm run build` | `dist/` に静的サイトを出力 |
| `npm run preview` | ビルド結果を確認 |
| `npm test` | 計算ロジックと事実データの単体テスト（Vitest） |
| `npm run check` | 型チェック（astro check） |
| `npm run test:e2e` | 表示・操作・アクセシビリティ（axe）・JS無効・reduced-motion の E2E テスト（Playwright）。先に `npm run build` が必要 |
| `npm run fonts` | フォントのサブセットを作り直す（要 `pip install fonttools brotli`）。文字を増やして `npm test` のフォント検査が落ちたら実行 |

## 数値のルール

- 図と本文の数値は `src/data/facts/*.yaml` から ID で参照します（`<Fact id="…" k="…" />`、または `valueOf()`）。
- 出典（`source.url`・`publisher`・`title`）と時点（`asOf`）がない事実、重複した ID、存在しない ID の参照はビルドエラーになります（`src/lib/facts.ts`）。
- `volatility: volatile` の値には「○年○月時点」が自動で付きます。`derived` がある値には「当方算出」の印と計算式が付きます。
- 出典番号はページごとに自動で振られ、章末に出典一覧が出ます。

## ディレクトリ

```
src/
  pages/            index・about・404・chapters/01〜07
  layouts/          BaseLayout（ヘッダー・フッター・章遷移のワイプ）、ChapterLayout（章扉・要点・出典一覧・前後ナビ）
  components/       Fact・Figure・Term・SourceList・ChapterNav など
  diagrams/         章ごとの図解（01-timing〜08-performance）。simple/ に各章冒頭のやさしい図、shared/ にスクロール図の共通エンジン（Scrolly）
  data/             facts/*.yaml（事実データ）、chapters.ts、glossary.ts
  lib/              loan・volume・budget・tsubo・iso・format（DOM に触れない純粋関数）
tests/unit, tests/e2e
```

## 公開（GitHub Pages）

1. リポジトリの Settings → Pages → Build and deployment の Source を「GitHub Actions」にする。
2. `main` に push すると `.github/workflows/deploy.yml` がテスト・型チェック・ビルドをして公開します。
3. 公開先は `https://mizuki-majima.github.io/home_selection/`（`astro.config.mjs` の `base`）。リポジトリ名を変える場合は `base` と `public/robots.txt` も合わせて変更してください。

## 設計書からの変更点

- 公開リポジトリ名を `house-note` ではなく既存の `home_selection` としたため、`base` を `/home_selection` にしています。
- 章本文は MDX ではなく `.astro` で書いています（図解コンポーネントと出典番号の採番順を確実にするため）。
- アクセント色は、文字に使ったときもコントラスト比 AA を満たすよう `#b5543a` から `#a3462f` に少し濃くしています。
- フォントは Fontsource の配信（3ウェイト・約100ファイル・1.6MB）ではなく、使う文字だけのサブセット（500と800の2ファイル・計約350KB）にしています。太字の700は800で表示されます。
- 公開後、「いきなり内容が難しい」という意見を受けて、章をやさしい順（8章）に並べ替えました。旧URL（例：`/chapters/05-structure/`）は新しい章へ移動する案内ページを残しています。
- スクロール図の画面固定は、GSAP の pin ではなく CSS の `position: sticky` ＋ ScrollTrigger の scrub で実装しています（スマホでの安定性のため）。
