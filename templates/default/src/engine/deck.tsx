import { useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigation } from "./navigation";
import { Slide } from "./slide";
import type { SlideData, PresentationConfig } from "./parser";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface DeckProps {
  slides: SlideData[];
  config: PresentationConfig;
}

export function Deck({ slides, config }: DeckProps): React.ReactElement {
  const fragmentCounts = useMemo(() => slides.map((s) => s.fragmentCount), [slides]);

  const { currentSlide, currentFragment } = useNavigation(slides.length, fragmentCounts);

  const presenterRef = useRef<Window | null>(null);

  useEffect(() => {
    document.title = config.title;
  }, [config.title]);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
  }, [config.theme]);

  useEffect(() => {
    function updateScale() {
      const sw = window.innerWidth / 1280;
      const sh = window.innerHeight / 720;
      document.documentElement.style.setProperty("--scale", String(Math.min(sw, sh)));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const updatePresenter = useCallback(
    (win: Window) => {
      const activeSlide = slides[currentSlide];
      const nextSlideData = slides[currentSlide + 1];

      win.document.body.innerHTML = `
        <div class="presenter-layout">
          <div class="current-slide">
            <h3>Current (${currentSlide + 1} / ${slides.length})</h3>
            <div class="slide-content">${escapeHtml(activeSlide?.content ?? "")}</div>
          </div>
          <div class="next-slide">
            <h3>Next</h3>
            <div class="slide-content">${escapeHtml(nextSlideData?.content ?? "(end)")}</div>
          </div>
          <div class="notes-panel">
            <h3>Notes</h3>
            <div class="slide-content">${escapeHtml(activeSlide?.notes ?? "(no notes)")}</div>
          </div>
        </div>
        <div class="timer" id="timer">00:00</div>
      `;

      if (!(win as Window & { _timerStarted?: boolean })._timerStarted) {
        (win as Window & { _timerStarted?: boolean })._timerStarted = true;
        const start = Date.now();
        const interval = win.setInterval(() => {
          const elapsed = Math.floor((Date.now() - start) / 1000);
          const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
          const secs = String(elapsed % 60).padStart(2, "0");
          const el = win.document.getElementById("timer");
          if (el) el.textContent = `${mins}:${secs}`;
        }, 1000);
        win.addEventListener("beforeunload", () => win.clearInterval(interval));
      }
    },
    [currentSlide, slides],
  );

  const openPresenter = useCallback(() => {
    if (presenterRef.current && !presenterRef.current.closed) {
      presenterRef.current.focus();
      return;
    }
    const win = window.open("", "presenter", "width=1024,height=768");
    if (!win) return;
    presenterRef.current = win;
    win.document.title = "Presenter View";
    const style = win.document.createElement("style");
    style.textContent = `
      body { margin: 0; padding: 1rem; background: #1a1a1a; color: #eee; font-family: system-ui, sans-serif; }
      .presenter-layout { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto 1fr; gap: 1rem; height: calc(100vh - 2rem); }
      .current-slide { grid-row: 1 / 3; background: #222; border-radius: 8px; padding: 1rem; overflow: auto; }
      .next-slide { background: #222; border-radius: 8px; padding: 1rem; overflow: auto; opacity: 0.7; }
      .notes-panel { background: #222; border-radius: 8px; padding: 1rem; overflow: auto; }
      .timer { position: fixed; top: 0.5rem; right: 1rem; font-size: 1.5rem; font-variant-numeric: tabular-nums; }
      h3 { margin: 0 0 0.5rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
      .slide-content { white-space: pre-wrap; font-size: 0.875rem; line-height: 1.6; }
    `;
    win.document.head.appendChild(style);
    updatePresenter(win);
  }, [updatePresenter]);

  useEffect(() => {
    const win = presenterRef.current;
    if (!win || win.closed) return;
    updatePresenter(win);
  }, [updatePresenter]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "p" || event.key === "P") {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        event.preventDefault();
        openPresenter();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPresenter]);

  const activeSlide = slides[currentSlide];
  const hasSlides = slides.length > 0;

  return (
    <div className="deck" data-slide-index={hasSlides ? currentSlide : -1}>
      {hasSlides && activeSlide ? (
        <Slide data={activeSlide} currentFragment={currentFragment} />
      ) : (
        <div className="slide slide-empty">
          <h1>No slides yet</h1>
          <p>
            Add content to your Markdown file and separate slides with <code>---</code>.
          </p>
        </div>
      )}
      <div className="slide-number">
        {hasSlides ? currentSlide + 1 : 0} / {slides.length}
      </div>
    </div>
  );
}
