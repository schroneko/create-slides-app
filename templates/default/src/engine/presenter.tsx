import type { SlideData } from "./parser";

export function openPresenterWindow(
  slides: SlideData[],
  currentSlide: number,
  currentFragment: number,
): Window | null {
  const win = window.open("", "presenter", "width=900,height=700");
  if (!win) return null;

  win.document.title = "Presenter View";
  updatePresenterWindow(win, slides, currentSlide, currentFragment);
  return win;
}

export function updatePresenterWindow(
  win: Window,
  slides: SlideData[],
  currentSlide: number,
  _currentFragment: number,
): void {
  const slide = slides[currentSlide];
  const nextSlide = slides[currentSlide + 1];

  win.document.body.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #eee; padding: 1.5rem; }
      .presenter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; height: calc(100vh - 3rem); }
      .panel { background: #2a2a2a; border-radius: 12px; padding: 1.25rem; overflow: auto; }
      .panel h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 0.75rem; }
      .notes-text { font-size: 1.1rem; line-height: 1.7; white-space: pre-wrap; }
      .slide-preview { font-size: 0.8rem; line-height: 1.5; white-space: pre-wrap; color: #ccc; }
      .timer { font-size: 2rem; font-variant-numeric: tabular-nums; text-align: center; padding: 0.5rem; }
      .slide-count { text-align: center; font-size: 1rem; color: #888; margin-top: 0.5rem; }
    </style>
    <div class="presenter-grid">
      <div class="panel">
        <h3>Notes</h3>
        <div class="notes-text">${escapeHtml(slide?.notes ?? "(no notes)")}</div>
      </div>
      <div class="panel">
        <h3>Next Slide</h3>
        <div class="slide-preview">${escapeHtml(nextSlide?.content ?? "(end)")}</div>
      </div>
      <div class="panel" style="grid-column: span 2">
        <div class="timer" id="timer">00:00:00</div>
        <div class="slide-count">${currentSlide + 1} / ${slides.length}</div>
      </div>
    </div>
  `;

  if (!(win as unknown as Record<string, unknown>).__timerStart) {
    (win as unknown as Record<string, unknown>).__timerStart = Date.now();
  }
  const start = (win as unknown as Record<string, unknown>).__timerStart as number;

  if ((win as unknown as Record<string, unknown>).__timerInterval) {
    clearInterval((win as unknown as Record<string, unknown>).__timerInterval as number);
  }

  (win as unknown as Record<string, unknown>).__timerInterval = setInterval(() => {
    const el = win.document.getElementById("timer");
    if (!el) return;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
