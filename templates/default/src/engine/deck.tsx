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

  return (
    <div className="deck">
      {activeSlide && <Slide data={activeSlide} />}
      <div className="slide-number">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}
