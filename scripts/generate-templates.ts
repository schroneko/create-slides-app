import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");

const mitLicense = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const revealCopyright =
  "Copyright (C) 2011-2024 Hakim El Hattab, http://hakim.se, and reveal.js contributors";

const localFontReplacements: Record<string, string> = {
  "@import url(./fonts/source-sans-pro/source-sans-pro.css);":
    "@import url(https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i,700,700i);",
  "@import url(./fonts/league-gothic/league-gothic.css);":
    "@import url(https://fonts.googleapis.com/css?family=League+Gothic);",
};

type ThemeEntry = {
  name: string;
  title: string;
};

type ExternalThemeEntry = {
  id: string;
  title: string;
  fontSans: string;
  fontMono: string;
  fontImports: string[];
  bg: string;
  surface: string;
  text: string;
  heading: string;
  accent: string;
  codeBg: string;
  line: string;
  source: {
    project: string;
    url: string;
    copyright: string;
  };
};

const themes: ThemeEntry[] = [
  { name: "black", title: "Reveal.js Black" },
  { name: "white", title: "Reveal.js White" },
  { name: "league", title: "Reveal.js League" },
  { name: "beige", title: "Reveal.js Beige" },
  { name: "sky", title: "Reveal.js Sky" },
  { name: "night", title: "Reveal.js Night" },
  { name: "serif", title: "Reveal.js Serif" },
  { name: "simple", title: "Reveal.js Simple" },
  { name: "solarized", title: "Reveal.js Solarized" },
  { name: "blood", title: "Reveal.js Blood" },
  { name: "moon", title: "Reveal.js Moon" },
  { name: "dracula", title: "Reveal.js Dracula" },
  { name: "black-contrast", title: "Reveal.js Black Contrast" },
  { name: "white-contrast", title: "Reveal.js White Contrast" },
];

const externalThemes: ExternalThemeEntry[] = [
  {
    id: "robot-lung",
    title: "Robot Lung",
    fontSans: '"Roboto Slab", serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;700&display=swap"],
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#363636",
    heading: "#141414",
    accent: "#FF4081",
    codeBg: "rgba(0, 0, 0, 0.05)",
    line: "rgba(54, 54, 54, 0.12)",
    source: {
      project: "dzello/revealjs-themes",
      url: "https://github.com/dzello/revealjs-themes",
      copyright: "Copyright (c) Josh Dzielak",
    },
  },
  {
    id: "sunblind",
    title: "Sunblind",
    fontSans: '"Lato", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@300;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Lora:wght@700&display=swap",
    ],
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#363636",
    heading: "#141414",
    accent: "#FF4081",
    codeBg: "rgba(0, 0, 0, 0.05)",
    line: "rgba(54, 54, 54, 0.12)",
    source: {
      project: "dzello/revealjs-themes",
      url: "https://github.com/dzello/revealjs-themes",
      copyright: "Copyright (c) Josh Dzielak",
    },
  },
  {
    id: "hull-blue",
    title: "Hull Blue",
    fontSans: '"Roboto Slab", serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;700&display=swap"],
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#363636",
    heading: "#141414",
    accent: "#0090e9",
    codeBg: "rgba(0, 0, 0, 0.05)",
    line: "rgba(54, 54, 54, 0.12)",
    source: {
      project: "dzello/revealjs-themes",
      url: "https://github.com/dzello/revealjs-themes",
      copyright: "Copyright (c) Josh Dzielak",
    },
  },
  {
    id: "catppuccin-latte",
    title: "Catppuccin Latte",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#eff1f5",
    surface: "#e6e9ef",
    text: "#4c4f69",
    heading: "#1e66f5",
    accent: "#7287fd",
    codeBg: "#dce0e8",
    line: "rgba(76, 79, 105, 0.15)",
    source: {
      project: "catppuccin/reveal.js",
      url: "https://github.com/catppuccin/reveal.js",
      copyright: "Copyright (c) Catppuccin contributors",
    },
  },
  {
    id: "catppuccin-frappe",
    title: "Catppuccin Frappe",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#303446",
    surface: "#292c3c",
    text: "#c6d0f5",
    heading: "#8caaee",
    accent: "#babbf1",
    codeBg: "#232634",
    line: "rgba(198, 208, 245, 0.15)",
    source: {
      project: "catppuccin/reveal.js",
      url: "https://github.com/catppuccin/reveal.js",
      copyright: "Copyright (c) Catppuccin contributors",
    },
  },
  {
    id: "rose-pine",
    title: "Rose Pine",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#191724",
    surface: "#1f1d2e",
    text: "#e0def4",
    heading: "#ebbcba",
    accent: "#c4a7e7",
    codeBg: "#26233a",
    line: "rgba(224, 222, 244, 0.12)",
    source: {
      project: "RAINBOWFLESH/rose-pine-marp",
      url: "https://github.com/RAINBOWFLESH/rose-pine-marp",
      copyright: "Copyright (c) RAINBOWFLESH",
    },
  },
  {
    id: "rose-pine-moon",
    title: "Rose Pine Moon",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#232136",
    surface: "#2a273f",
    text: "#e0def4",
    heading: "#ea9a97",
    accent: "#c4a7e7",
    codeBg: "#393552",
    line: "rgba(224, 222, 244, 0.12)",
    source: {
      project: "RAINBOWFLESH/rose-pine-marp",
      url: "https://github.com/RAINBOWFLESH/rose-pine-marp",
      copyright: "Copyright (c) RAINBOWFLESH",
    },
  },
  {
    id: "rose-pine-dawn",
    title: "Rose Pine Dawn",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#faf4ed",
    surface: "#fffaf3",
    text: "#575279",
    heading: "#d7827e",
    accent: "#907aa9",
    codeBg: "#f2e9e1",
    line: "rgba(87, 82, 121, 0.12)",
    source: {
      project: "RAINBOWFLESH/rose-pine-marp",
      url: "https://github.com/RAINBOWFLESH/rose-pine-marp",
      copyright: "Copyright (c) RAINBOWFLESH",
    },
  },
  {
    id: "dracula-marp",
    title: "Dracula",
    fontSans: '"IBM Plex Sans", sans-serif',
    fontMono: '"IBM Plex Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap",
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap",
    ],
    bg: "#282a36",
    surface: "#282a36",
    text: "#f8f8f2",
    heading: "#ff79c6",
    accent: "#8be9fd",
    codeBg: "#44475a",
    line: "rgba(248, 248, 242, 0.12)",
    source: {
      project: "dracula/marp",
      url: "https://github.com/dracula/marp",
      copyright: "Copyright (c) Daniel Nicolas Gisolfi",
    },
  },
  {
    id: "academic",
    title: "Academic",
    fontSans: '"Noto Sans JP", sans-serif',
    fontMono: '"Source Code Pro", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap",
    ],
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#333333",
    heading: "#800000",
    accent: "#800000",
    codeBg: "#f5f5f5",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "kzk4043/marp-theme-academic",
      url: "https://github.com/kzk4043/marp-theme-academic",
      copyright: "Copyright (c) Kazuki Yonemoto",
    },
  },
  {
    id: "bw",
    title: "Black & White",
    fontSans: '"Pretendard", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    fontImports: [
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap",
    ],
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#000000",
    heading: "#000000",
    accent: "#262626",
    codeBg: "#f5f5f5",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "yumainaura/and-and-and-and-and",
      url: "https://github.com/yumainaura/and-and-and-and-and",
      copyright: "Copyright (c) yumainaura",
    },
  },
  {
    id: "border",
    title: "Border",
    fontSans: '"Inter", sans-serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"],
    bg: "#f7f7f7",
    surface: "#f7f7f7",
    text: "#0a0a0a",
    heading: "#0a0a0a",
    accent: "#303030",
    codeBg: "rgba(100, 100, 100, 0.15)",
    line: "rgba(0, 0, 0, 0.15)",
    source: {
      project: "rnd195/my-marp-themes",
      url: "https://github.com/rnd195/my-marp-themes",
      copyright: "Copyright (c) rnd195",
    },
  },
  {
    id: "gradient",
    title: "Gradient",
    fontSans: '"Inter", sans-serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"],
    bg: "#dccee0",
    surface: "#c9d2d6",
    text: "#333333",
    heading: "#842174",
    accent: "#9d30a6",
    codeBg: "rgba(255, 255, 255, 0.68)",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "rnd195/my-marp-themes",
      url: "https://github.com/rnd195/my-marp-themes",
      copyright: "Copyright (c) rnd195",
    },
  },
  {
    id: "graph-paper",
    title: "Graph Paper",
    fontSans: '"Work Sans", sans-serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.googleapis.com/css2?family=Work+Sans&display=swap"],
    bg: "#e3e3f1",
    surface: "#e3e3f1",
    text: "#121114",
    heading: "#040014",
    accent: "#040014",
    codeBg: "#ffffff",
    line: "rgba(4, 0, 20, 0.12)",
    source: {
      project: "rnd195/my-marp-themes",
      url: "https://github.com/rnd195/my-marp-themes",
      copyright: "Copyright (c) rnd195",
    },
  },
  {
    id: "indie-gaia",
    title: "Indie Gaia",
    fontSans: "system-ui, sans-serif",
    fontMono: '"Roboto Mono", monospace',
    fontImports: ["https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap"],
    bg: "#fff8e1",
    surface: "#fff8e1",
    text: "#455a64",
    heading: "#0288d1",
    accent: "#0288d1",
    codeBg: "rgba(0, 0, 0, 0.05)",
    line: "rgba(69, 90, 100, 0.12)",
    source: {
      project: "onwhenrdy/indie-gaia",
      url: "https://github.com/onwhenrdy/indie-gaia",
      copyright: "Copyright (c) Carsten Witt",
    },
  },
  {
    id: "olive",
    title: "Olive",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#4e4f53",
    surface: "#4e4f53",
    text: "#FFF2DD",
    heading: "#CCA551",
    accent: "#CCA551",
    codeBg: "#dcd1c1",
    line: "rgba(255, 242, 221, 0.15)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "olive-invert",
    title: "Olive Invert",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#4e4f53",
    heading: "#CCA551",
    accent: "#CCA551",
    codeBg: "rgba(78, 79, 83, 0.1)",
    line: "rgba(78, 79, 83, 0.15)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "olive-gold",
    title: "Olive Gold",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#CCA551",
    surface: "#CCA551",
    text: "#4e4f53",
    heading: "#FFF2DD",
    accent: "#FFF2DD",
    codeBg: "#676053",
    line: "rgba(78, 79, 83, 0.15)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-green",
    title: "Colors Green",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#32B490",
    accent: "#32B490",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-blue",
    title: "Colors Blue",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#01BBD4",
    accent: "#01BBD4",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-pink",
    title: "Colors Pink",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#FF3F80",
    accent: "#FF3F80",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-red",
    title: "Colors Red",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#FF5152",
    accent: "#FF5152",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-purple",
    title: "Colors Purple",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#454D71",
    accent: "#454D71",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "colors-orange",
    title: "Colors Orange",
    fontSans: '"Lato", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;900&display=swap",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap",
    ],
    bg: "#FFF2DD",
    surface: "#FFF2DD",
    text: "#465A65",
    heading: "#FF9000",
    accent: "#FF9000",
    codeBg: "rgba(70, 90, 101, 0.1)",
    line: "rgba(70, 90, 101, 0.12)",
    source: {
      project: "matsubara0507/marp-themes",
      url: "https://github.com/matsubara0507/marp-themes",
      copyright: "Copyright (c) MATSUBARA Nobutada",
    },
  },
  {
    id: "cybertopia",
    title: "Cybertopia",
    fontSans: "system-ui, sans-serif",
    fontMono: "monospace",
    fontImports: [],
    bg: "#000000",
    surface: "#101010",
    text: "#ffffff",
    heading: "#ffffff",
    accent: "#02c797",
    codeBg: "#101010",
    line: "rgba(2, 199, 151, 0.2)",
    source: {
      project: "noraj/cybertopia-marp",
      url: "https://github.com/noraj/cybertopia-marp",
      copyright: "Copyright (c) noraj",
    },
  },
  {
    id: "wave",
    title: "Wave",
    fontSans: '"Roboto", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500&display=swap",
    ],
    bg: "#002233",
    surface: "#002451",
    text: "#ffffff",
    heading: "#ffffff",
    accent: "#80B3FF",
    codeBg: "#002451",
    line: "rgba(255, 255, 255, 0.12)",
    source: {
      project: "JuliusWiedemann/MarpThemeWave",
      url: "https://github.com/JuliusWiedemann/MarpThemeWave",
      copyright: "Copyright (c) Julius Wiedemann",
    },
  },
  {
    id: "marpx-cantor",
    title: "MarpX Cantor",
    fontSans: '"Charter", serif',
    fontMono: "monospace",
    fontImports: ["https://fonts.cdnfonts.com/css/charter-itc-tt"],
    bg: "#f7f7f7",
    surface: "#e8e8e8",
    text: "#2e2e2e",
    heading: "#242060",
    accent: "#f0a211",
    codeBg: "#fffbe7",
    line: "rgba(46, 46, 46, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-church",
    title: "MarpX Church",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#ebebeb",
    surface: "#f6f6f6",
    text: "#040d21",
    heading: "#00306b",
    accent: "#31406b",
    codeBg: "#fffbe7",
    line: "rgba(4, 13, 33, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-copernicus",
    title: "MarpX Copernicus",
    fontSans: '"Fira Sans", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;600;700&display=swap",
    ],
    bg: "#cad1e4",
    surface: "#eff4fa",
    text: "#3b4963",
    heading: "#040d21",
    accent: "#ff4500",
    codeBg: "#fffbe7",
    line: "rgba(59, 73, 99, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-einstein",
    title: "MarpX Einstein",
    fontSans: '"Source Sans Pro", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600&display=swap",
    ],
    bg: "#3e3f42",
    surface: "#3e3f42",
    text: "#edf2f5",
    heading: "#f8e3b5",
    accent: "#ff8f07",
    codeBg: "rgba(255, 255, 255, 0.1)",
    line: "rgba(237, 242, 245, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-frankfurt",
    title: "MarpX Frankfurt",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#f5f4ef",
    surface: "#eff4fa",
    text: "#000000",
    heading: "#02000a",
    accent: "#3e6ceb",
    codeBg: "#fffbe7",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-galileo",
    title: "MarpX Galileo",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#0c1e38",
    surface: "#162e51",
    text: "#ffffff",
    heading: "#ffbf00",
    accent: "#ffbf00",
    codeBg: "rgba(255, 255, 255, 0.08)",
    line: "rgba(255, 255, 255, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-gauss",
    title: "MarpX Gauss",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#fafafa",
    surface: "#faf7f7",
    text: "#040d21",
    heading: "#040d21",
    accent: "#31406b",
    codeBg: "#fffbe7",
    line: "rgba(4, 13, 33, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-goedel",
    title: "MarpX Goedel",
    fontSans: '"Fira Sans Condensed", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:wght@300;400;600;700&display=swap",
    ],
    bg: "#eeeeee",
    surface: "#faf7f7",
    text: "#000000",
    heading: "#040d21",
    accent: "#31406b",
    codeBg: "#fffbe7",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-gropius",
    title: "MarpX Gropius",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#eae8e3",
    surface: "#faf7f7",
    text: "#040d21",
    heading: "#040d21",
    accent: "#31406b",
    codeBg: "#fffbe7",
    line: "rgba(4, 13, 33, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-haskell",
    title: "MarpX Haskell",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#ebebeb",
    surface: "#faf7f7",
    text: "#040d21",
    heading: "#00306b",
    accent: "#31406b",
    codeBg: "#fffbe7",
    line: "rgba(4, 13, 33, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-hobbes",
    title: "MarpX Hobbes",
    fontSans: '"Bitter", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Bitter:wght@100;400;700;900&display=swap",
    ],
    bg: "#dcded3",
    surface: "#dcded3",
    text: "#2e2e2e",
    heading: "#242060",
    accent: "#f0a211",
    codeBg: "#fffbe7",
    line: "rgba(46, 46, 46, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-lorca",
    title: "MarpX Lorca",
    fontSans: '"Fira Sans", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;600;700&display=swap",
    ],
    bg: "#ffffff",
    surface: "#faf7f7",
    text: "#000000",
    heading: "#040d21",
    accent: "#d53044",
    codeBg: "#fffbe7",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-newton",
    title: "MarpX Newton",
    fontSans: '"Faustina", serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Faustina:wght@300;400;600;700&display=swap",
    ],
    bg: "#eae8e3",
    surface: "#E4E3DF",
    text: "#071636",
    heading: "#002238",
    accent: "#ff3300",
    codeBg: "#fffbe7",
    line: "rgba(7, 22, 54, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-socrates",
    title: "MarpX Socrates",
    fontSans: '"Fira Sans", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;600;700&display=swap",
    ],
    bg: "#ffffff",
    surface: "#faf7f7",
    text: "#000000",
    heading: "#040d21",
    accent: "#f8150d",
    codeBg: "#fffbe7",
    line: "rgba(0, 0, 0, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
  {
    id: "marpx-sparta",
    title: "MarpX Sparta",
    fontSans: '"Fira Sans", sans-serif',
    fontMono: "monospace",
    fontImports: [
      "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;600;700&display=swap",
    ],
    bg: "#ececec",
    surface: "#abb0b9",
    text: "#343e52",
    heading: "#040d21",
    accent: "#6d6bee",
    codeBg: "rgba(99, 97, 243, 0.12)",
    line: "rgba(52, 62, 82, 0.12)",
    source: {
      project: "cunhapaulo/MarpX",
      url: "https://github.com/cunhapaulo/MarpX",
      copyright: "Copyright (c) Paulo Cunha",
    },
  },
];

const seedDir = path.join(templatesRoot, "reveal.js-black");

const seedFiles = new Map<string, string>();
for (const relativePath of [
  "index.html",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "src/app.tsx",
  "src/vite-env.d.ts",
  "src/engine/deck.tsx",
  "src/engine/frontmatter.ts",
  "src/engine/navigation.ts",
  "src/engine/parser.ts",
  "src/engine/slide.tsx",
  "src/engine/presenter.tsx",
  "src/styles/base.css",
]) {
  seedFiles.set(relativePath, fs.readFileSync(path.join(seedDir, relativePath), "utf8"));
}

function adaptRevealCss(originalCss: string, themeName: string): string {
  const dirName = `reveal.js-${themeName}`;
  const scope = `[data-theme="${dirName}"]`;

  let lines = originalCss.split("\n");

  const fontImports: string[] = [];
  const remaining: string[] = [];

  for (const line of lines) {
    if (line.startsWith("@import")) {
      let importLine = line;
      for (const [local, cdn] of Object.entries(localFontReplacements)) {
        if (importLine === local) {
          importLine = cdn;
        }
      }
      fontImports.push(importLine);
    } else {
      remaining.push(line);
    }
  }

  let css = remaining.join("\n");

  css = css.replace(/section\.has-light-background[^}]*\{[^}]*\}/g, "");
  css = css.replace(/html \* \{[^}]*\}/g, "");

  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  css = css.replace(/:root\s*\{/, `${scope} {`);

  const bridge = `
${scope} {
  --font-sans: var(--r-main-font);
  --font-mono: var(--r-code-font);
  --color-bg: var(--r-background-color);
  --color-surface: var(--r-background-color);
  --color-text: var(--r-main-color);
  --color-heading: var(--r-heading-color);
  --color-accent: var(--r-link-color);
  --color-code-bg: rgba(127, 127, 127, 0.15);
  --color-line: rgba(127, 127, 127, 0.2);
}
`;
  css = css.replace(/--r-heading1-size:\s*[^;]+;/, "--r-heading1-size: clamp(1.5em, 4vw, 2.5em);");

  css = css + bridge;

  css = css.replace(/\.reveal-viewport\s*\{([^}]*)\}/g, `${scope} body {$1}`);

  css = css.replace(/\.reveal\s+\.slides\s+section\s*>\s*section/g, `${scope} .slide`);
  css = css.replace(/\.reveal\s+\.slides\s+section/g, `${scope} .slide`);

  css = css.replace(/\.reveal\s+\.code-wrapper\s+code/g, `${scope} .slide .code-wrapper code`);
  css = css.replace(/\.reveal\s+\.code-wrapper/g, `${scope} .slide .code-wrapper`);

  css = css.replace(/\.reveal\s+\.roll\s+span:after\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+a\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+a:hover\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.controls\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.progress\s*\{[^}]*\}/g, "");
  css = css.replace(/@media\s+print\s*\{[^}]*\{[^}]*\}\s*\}/g, "");

  css = css.replace(/\.reveal\s*\{/g, `${scope} .deck {`);

  css = css.replace(/\.reveal\s+/g, `${scope} .slide `);

  const header = `/*
 * reveal.js ${themeName} theme
 * Original: https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/${themeName}.css
 * Copyright: ${revealCopyright}
 * License: MIT
 *
 * Selectors adapted for create-slides-app engine.
 */`;

  const parts = [header];
  if (fontImports.length > 0) {
    parts.push(fontImports.join("\n"));
  }
  parts.push(css);

  let result = parts.join("\n\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim() + "\n";
}

function generateExternalThemeCss(theme: ExternalThemeEntry): string {
  const header = `/*
 * ${theme.title}
 * Original: ${theme.source.url}
 * ${theme.source.copyright}
 * License: MIT
 *
 * Colors adapted for create-slides-app engine.
 */`;

  const parts = [header];
  if (theme.fontImports.length > 0) {
    parts.push(theme.fontImports.map((u) => `@import url("${u}");`).join("\n"));
  }
  parts.push(`[data-theme="${theme.id}"] {
  --font-sans: ${theme.fontSans};
  --font-mono: ${theme.fontMono};
  --color-bg: ${theme.bg};
  --color-surface: ${theme.surface};
  --color-text: ${theme.text};
  --color-heading: ${theme.heading};
  --color-accent: ${theme.accent};
  --color-code-bg: ${theme.codeBg};
  --color-line: ${theme.line};
}`);

  return parts.join("\n\n") + "\n";
}

function renderParser(themeId: string): string {
  return seedFiles
    .get("src/engine/parser.ts")!
    .replace(
      /theme: \(data\.theme as string\) \?\? "[^"]+",/,
      `theme: (data.theme as string) ?? "${themeId}",`,
    );
}

function renderMain(themeId: string): string {
  return `import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../example.md?raw";
import "katex/dist/katex.min.css";
import "./styles/base.css";
import "./styles/themes/${themeId}.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App markdown={slidesRaw} />);

if (import.meta.hot) {
  import.meta.hot.accept("../example.md?raw", (mod) => {
    if (mod) {
      root.render(<App markdown={mod.default} />);
    }
  });
}
`;
}

function renderSlides(dirName: string, title: string): string {
  return `---
title: ${title}
theme: ${dirName}
---

<!-- layout: title -->

# ${title}

Theme: ${dirName}

---

# Syntax Highlighting

\`\`\`typescript
interface Slide {
  title: string;
  content: string;
  notes?: string;
}

function present(slides: Slide[]): void {
  for (const slide of slides) {
    render(slide);
  }
}
\`\`\`

---

# Math

Inline math: $E = mc^2$

Block math:

$$
\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}
$$

---

# Diagrams

\`\`\`mermaid
graph LR
    A[Markdown] --> B[create-slides-app]
    B --> C[Dev Server]
    B --> D[Static HTML]
    B --> E[PDF]
    B --> F[MP4]
\`\`\`

---

# Step-by-step Reveal

<!-- fragment -->

- Write your slides in Markdown
- Run a single command
- Present in the browser

---

# Get Started

Edit this file and start presenting

Note:
Speaker notes are visible only in presenter mode.
Press P to open the presenter window.
`;
}

function renderThirdPartyNotice(themeName: string): string {
  return `# Third-Party Notices

## hakimel/reveal.js

This template uses the ${themeName} theme CSS from reveal.js, adapted for
the create-slides-app slide engine.

- Project: \`hakimel/reveal.js\`
- Source: <https://github.com/hakimel/reveal.js>
- Theme CSS: <https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/${themeName}.css>
- License: MIT

${revealCopyright}

${mitLicense}`;
}

function renderExternalThirdPartyNotice(theme: ExternalThemeEntry): string {
  return `# Third-Party Notices

## ${theme.source.project}

This template uses colors and fonts from the ${theme.title} theme, adapted for
the create-slides-app slide engine.

- Project: \`${theme.source.project}\`
- Source: <${theme.source.url}>
- License: MIT

${theme.source.copyright}

${mitLicense}`;
}

function writeFile(targetPath: string, content: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

const vendorDir = path.join(repoRoot, "vendor", "reveal.js", "theme");

if (!fs.existsSync(vendorDir)) {
  console.error(`Vendor CSS not found at ${vendorDir}. Download reveal.js themes first.`);
  process.exit(1);
}

for (const theme of themes) {
  const dirName = `reveal.js-${theme.name}`;
  const targetDir = path.join(templatesRoot, dirName);

  const originalCssPath = path.join(vendorDir, `${theme.name}.css`);
  if (!fs.existsSync(originalCssPath)) {
    console.error(`Missing vendor CSS: ${originalCssPath}`);
    process.exit(1);
  }

  const originalCss = fs.readFileSync(originalCssPath, "utf8");
  const adaptedCss = adaptRevealCss(originalCss, theme.name);

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const [relativePath, content] of seedFiles) {
    writeFile(path.join(targetDir, relativePath), content);
  }

  writeFile(path.join(targetDir, "src/engine/parser.ts"), renderParser(dirName));
  writeFile(path.join(targetDir, "src/main.tsx"), renderMain(dirName));
  writeFile(path.join(targetDir, "example.md"), renderSlides(dirName, theme.title));
  writeFile(path.join(targetDir, "THIRD_PARTY_NOTICES.md"), renderThirdPartyNotice(theme.name));
  writeFile(path.join(targetDir, "src/styles/themes", `${dirName}.css`), adaptedCss);
}

for (const theme of externalThemes) {
  const targetDir = path.join(templatesRoot, theme.id);

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const [relativePath, content] of seedFiles) {
    writeFile(path.join(targetDir, relativePath), content);
  }

  writeFile(path.join(targetDir, "src/engine/parser.ts"), renderParser(theme.id));
  writeFile(path.join(targetDir, "src/main.tsx"), renderMain(theme.id));
  writeFile(path.join(targetDir, "example.md"), renderSlides(theme.id, theme.title));
  writeFile(path.join(targetDir, "THIRD_PARTY_NOTICES.md"), renderExternalThirdPartyNotice(theme));
  writeFile(
    path.join(targetDir, "src/styles/themes", `${theme.id}.css`),
    generateExternalThemeCss(theme),
  );
}

console.log(
  `Generated ${themes.length} reveal.js templates and ${externalThemes.length} external templates.`,
);
