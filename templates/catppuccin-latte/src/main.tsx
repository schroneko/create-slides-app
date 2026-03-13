import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../example.md?raw";
import "katex/dist/katex.min.css";
import "./styles/base.css";
import "./styles/themes/catppuccin-latte.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App markdown={slidesRaw} />);

if (import.meta.hot) {
  import.meta.hot.accept("../example.md?raw", (mod) => {
    if (mod) {
      root.render(<App markdown={mod.default} />);
    }
  });
}
