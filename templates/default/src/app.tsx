import { useMemo } from "react";
import { parseSlides } from "./engine/parser";
import { Deck } from "./engine/deck";

interface AppProps {
  markdown: string;
}

export function App({ markdown }: AppProps): React.ReactElement {
  const presentation = useMemo(() => parseSlides(markdown), [markdown]);

  return <Deck slides={presentation.slides} config={presentation.config} />;
}
