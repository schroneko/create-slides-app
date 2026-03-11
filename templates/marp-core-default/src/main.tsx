import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../slides.md?raw";
import "./styles/base.css";
import "./styles/themes/marp-core-default.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
