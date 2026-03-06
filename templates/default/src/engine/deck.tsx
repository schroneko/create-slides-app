import { useEffect } from "react";
import { useNavigation } from "./navigation";
import { Slide } from "./slide";
import type { SlideData, PresentationConfig } from "./parser";

interface DeckProps {
  slides: SlideData[];
  config: PresentationConfig;
}

export function Deck({ slides, config }: DeckProps): React.ReactElement {
  const { currentSlide } = useNavigation(slides.length);

  useEffect(() => {
    document.title = config.title;
  }, [config.title]);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
  }, [config.theme]);

  const activeSlide = slides[currentSlide];
  const hasSlides = slides.length > 0;

  return (
    <div className="deck">
      {hasSlides && activeSlide ? (
        <Slide data={activeSlide} />
      ) : (
        <div className="slide slide-empty">
          <h1>No slides yet</h1>
          <p>Add content to <code>slides.md</code> and separate slides with <code>---</code>.</p>
        </div>
      )}
      <div className="slide-number">
        {hasSlides ? currentSlide + 1 : 0} / {slides.length}
      </div>
    </div>
  );
}
