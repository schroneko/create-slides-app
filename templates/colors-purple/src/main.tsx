import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../example.md?raw";
import "katex/dist/katex.min.css";
import "./styles/base.css";
import "./styles/themes/colors-purple.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
