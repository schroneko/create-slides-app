import { useState, useEffect, useMemo } from "react";
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

export function Slide({ data }: SlideProps): React.ReactElement | null {
  const [content, setContent] = useState<React.ReactElement | null>(null);

  const memoizedContent = useMemo(() => data.content, [data.content]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const file = await processor.process(memoizedContent);
      if (!cancelled) {
        setContent(file.result as React.ReactElement);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memoizedContent]);

  if (!content) return null;

  return <div className="slide">{content}</div>;
}
