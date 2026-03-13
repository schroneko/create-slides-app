import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../__SLIDES_MD__?raw";
import "./styles/base.css";
import "./styles/themes/reveal.js-night.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
