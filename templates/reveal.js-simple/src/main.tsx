import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../example.md?raw";
import "./styles/base.css";
import "./styles/themes/reveal.js-simple.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
