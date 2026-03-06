import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import * as jsxRuntime from "react/jsx-runtime";
import type { SlideData } from "./parser";

interface SlideProps {
  data: SlideData;
}

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeReact, jsxRuntime);

export function Slide({ data }: SlideProps): React.ReactElement {
  const content = useMemo(() => {
    try {
      const file = processor.processSync(data.content);
      return file.result as React.ReactElement;
    } catch {
      return (
        <div className="slide-fallback">
          <h2>Failed to render slide</h2>
          <p>Check the Markdown syntax for this slide.</p>
        </div>
      );
    }
  }, [data.content]);

  return <div className="slide">{content}</div>;
}
