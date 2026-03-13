# create-slides-app

CLI that generates a React-based slide app from Markdown.

## Usage

```bash
npx create-slides-app example.md
```

If the specified Markdown file does not exist, a sample slide deck is created automatically. Dependencies are installed, a dev server starts, and the browser opens. Running the same command again reuses the existing project directory without re-scaffolding.

Build static HTML:

```bash
npx create-slides-app deck.md --build
```

Export to PDF (requires Google Chrome):

```bash
npx create-slides-app deck.md --export pdf
```

Export to MP4 video with slide transitions (requires Google Chrome and ffmpeg):

```bash
npx create-slides-app deck.md --export mp4
```

Specify a template:

```bash
npx create-slides-app deck.md --template reveal.js-black
```

## CLI options

```bash
create-slides-app [slides.md] [--template <name>]
create-slides-app [slides.md] --build
create-slides-app [slides.md] --export <pdf|mp4>
create-slides-app [project-name] [--template <name>]
```

- `slides.md`: Markdown file to import. Created automatically if it does not exist. Output directory is derived from the filename.
- `project-name`: Output directory name.
- `--template`: Template name under `templates/`.
- `--build`: Build static HTML to `dist/` without starting a dev server.
- `--export pdf`: Export slides to PDF (requires Google Chrome).
- `--export mp4`: Export slides to MP4 video with fade transitions (requires Google Chrome and ffmpeg).

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
- Reads the Markdown file (same name as the input, e.g. `deck.md`) and splits slides by `---`
- Frontmatter supports `title` and `theme`
- Navigation with arrow keys, Space, Home, and End
- Each template ships a single theme
- `THIRD_PARTY_NOTICES.md` includes attribution and license

Example Markdown:

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

Root CLI:

```bash
npm install
npm run generate:templates
npm run install:templates
npm run check
npm run build
npm run smoke
```

Template app:

```bash
cd templates/reveal.js-black
npm install
npm run build
npm run dev
```

## CI

GitHub Actions runs:

- `npm ci` for the root CLI
- `npm run check`
- Install and build for each template under `templates/*`
