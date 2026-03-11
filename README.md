# create-slides-app

Markdown から React 製スライドアプリを生成する CLI です。

## Usage

```bash
npx create-slides-app my-slides
cd my-slides
npm install
npm run dev
```

`http://localhost:3030` でスライドを表示します。

Markdown ファイルを元に作ることもできます。

```bash
npx create-slides-app deck.md --template reveal.js-black
cd deck
npm install
npm run dev
```

## CLI options

```bash
create-slides-app [project-name] [--template <name>]
create-slides-app [slides.md] [--template <name>]
create-slides-app [--template <name>]
```

- `project-name`: 生成先ディレクトリ名
- `slides.md`: 取り込む Markdown ファイル。出力先はファイル名から自動決定
- `--template`: `templates/` 配下にあるテンプレート名だけ指定可能

## Available templates

- `quarto-revealjs-clean`
- `reveal.js-black`
- `reveal.js-white`
- `reveal.js-league`
- `reveal.js-beige`
- `reveal.js-sky`
- `reveal.js-night`
- `reveal.js-serif`
- `reveal.js-simple`
- `reveal.js-solarized`
- `reveal.js-blood`
- `reveal.js-moon`
- `reveal.js-dracula`
- `marp-core-default`
- `marp-core-gaia`
- `marp-core-uncover`
- `themes-default`
- `themes-seriph`
- `themes-apple-basic`
- `slidev-theme-geist`

## Template notes

- React + Vite + TypeScript
- `slides.md` を読み込み、`---` 区切りでスライド分割
- 先頭 frontmatter で `title` と `theme` を指定可能
- 矢印キー、Space、Home、End によるナビゲーション
- 各テンプレートは単一テーマ構成
- `THIRD_PARTY_NOTICES.md` に出典とライセンスを同梱

`slides.md` の例:

```md
---
title: Demo Deck
theme: reveal.js-black
---

# Intro

Welcome

---

# Next

- Item 1
- Item 2
```

## Development

ルート CLI:

```bash
npm install
npm run generate:templates
npm run install:templates
npm run check
npm run build
npm run smoke
```

テンプレートアプリ:

```bash
cd templates/reveal.js-black
npm install
npm run build
npm run dev
```

## CI

GitHub Actions で以下を自動実行します。

- ルート CLI の `npm ci`
- `npm run check`
- `templates/*` の依存関係インストールと build
