# create-slides-app

Markdown から React 製スライドアプリを生成する CLI です。

## Usage

```bash
npx create-slides-app example.md
```

指定した Markdown ファイルが存在しなければサンプルスライドを自動生成します。依存のインストール、dev サーバーの起動、ブラウザのオープンまで自動で行います。

静的 HTML をビルドする場合:

```bash
npx create-slides-app deck.md --build
```

PDF にエクスポートする場合 (Google Chrome が必要):

```bash
npx create-slides-app deck.md --export
```

テンプレートを指定する場合:

```bash
npx create-slides-app deck.md --template reveal.js-black
```

## CLI options

```bash
create-slides-app [slides.md] [--template <name>]
create-slides-app [slides.md] --build
create-slides-app [slides.md] --export
create-slides-app [project-name] [--template <name>]
```

- `slides.md`: 取り込む Markdown ファイル。存在しなければサンプルを自動生成。出力先はファイル名から自動決定
- `project-name`: 生成先ディレクトリ名
- `--template`: `templates/` 配下にあるテンプレート名だけ指定可能
- `--build`: dev サーバーを起動せず `dist/` に静的 HTML を出力
- `--export`: スライドを PDF にエクスポート (Google Chrome が必要)

## Available templates

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

All themes are adapted from the original reveal.js theme CSS (MIT license).

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
