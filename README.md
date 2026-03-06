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

## CLI options

```bash
create-slides-app [project-name] [--template default]
```

- `project-name`: 生成先ディレクトリ名
- `--template`: 使うテンプレート名。現状は `default` のみ

## Default template

- React + Vite + TypeScript
- `slides.md` を読み込み、`---` 区切りでスライド分割
- 先頭 frontmatter で `title` と `theme` を指定可能
- 矢印キー、Space、Home、End によるナビゲーション
- CSS Variables ベースのテーマ

`slides.md` の例:

```md
---
title: Demo Deck
theme: minimal
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
npm --prefix templates/default install
npm run check
npm run build
npm run smoke
```

テンプレートアプリ:

```bash
cd templates/default
npm install
npm run build
npm run dev
```

## CI

GitHub Actions で以下を自動実行します。

- ルート CLI の `npm ci`
- `npm run check`
- `templates/default` の `npm ci`
