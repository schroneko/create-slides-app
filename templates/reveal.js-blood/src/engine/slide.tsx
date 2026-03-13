import { useState, useEffect, useRef } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import rehypeReact from "rehype-react";
import * as jsxRuntime from "react/jsx-runtime";
import type { SlideData } from "./parser";
import type { Root, Element } from "hast";

interface SlideProps {
  data: SlideData;
  currentFragment: number;
}

function MermaidBlock({ children }: { children?: React.ReactNode }): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const code = typeof children === "string" ? children : String(children ?? "");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({ startOnLoad: false, theme: "dark" });
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg: rendered } = await mermaid.render(id, code);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setSvg(`<pre>Mermaid render error</pre>`);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div
      ref={containerRef}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function rehypeMermaid() {
  return (tree: Root) => {
    function visit(node: Root | Element): void {
      if (!("children" in node)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "element" && child.tagName === "pre") {
          const codeEl = child.children.find(
            (c): c is Element => c.type === "element" && c.tagName === "code",
          );
          if (codeEl) {
            const className = codeEl.properties?.className;
            const classes = Array.isArray(className) ? className : [];
            if (classes.some((c) => c === "language-mermaid" || String(c) === "language-mermaid")) {
              const textContent = codeEl.children
                .filter((c) => c.type === "text")
                .map((c) => (c as { value: string }).value)
                .join("");
              node.children[i] = {
                type: "element",
                tagName: "div",
                properties: {
                  "data-mermaid": textContent,
                },
                children: [],
              };
            }
          }
        }
        if (child.type === "element") {
          visit(child);
        }
      }
    }
    visit(tree);
  };
}

function rehypeFragments(fragmentCount: number, currentFragment: number) {
  return (tree: Root) => {
    if (fragmentCount === 0) return;

    let fragmentIndex = 0;
    let inFragment = false;

    function visit(node: Root | Element): void {
      if (!("children" in node)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (
          (child.type === "comment" && child.value.trim() === "fragment") ||
          (child.type === "raw" &&
            (child as { value: string }).value.trim() === "<!-- fragment -->")
        ) {
          inFragment = true;
          continue;
        }
        if (
          child.type === "element" &&
          (child.tagName === "ul" || child.tagName === "ol") &&
          inFragment
        ) {
          for (const li of child.children) {
            if (li.type === "element" && li.tagName === "li") {
              fragmentIndex++;
              const cls = fragmentIndex <= currentFragment ? "fragment-visible" : "fragment-hidden";
              li.properties = li.properties ?? {};
              const existing = li.properties.className;
              if (Array.isArray(existing)) {
                existing.push(cls);
              } else if (typeof existing === "string") {
                li.properties.className = `${existing} ${cls}`;
              } else {
                li.properties.className = cls;
              }
            }
          }
          inFragment = false;
          continue;
        }
        if (child.type === "element") {
          visit(child);
        }
      }
    }
    visit(tree);
  };
}

function MermaidWrapper(props: React.HTMLAttributes<HTMLDivElement>) {
  const mermaidCode = (props as Record<string, unknown>)["data-mermaid"] as string | undefined;
  if (mermaidCode) {
    return <MermaidBlock>{mermaidCode}</MermaidBlock>;
  }
  return <div {...props} />;
}

export function Slide({ data, currentFragment }: SlideProps): React.ReactElement {
  const [content, setContent] = useState<React.ReactElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const processor = unified()
          .use(remarkParse)
          .use(remarkMath)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeKatex)
          .use(rehypeMermaid)
          .use(rehypeShiki, { theme: "vitesse-dark" })
          .use(rehypeFragments, data.fragmentCount, currentFragment)
          .use(rehypeReact, {
            ...jsxRuntime,
            components: {
              div: MermaidWrapper,
            },
          });
        const file = await processor.process(data.content);
        if (!cancelled) setContent(file.result as React.ReactElement);
      } catch {
        if (!cancelled)
          setContent(
            <div className="slide-fallback">
              <h2>Failed to render slide</h2>
              <p>Check the Markdown syntax for this slide.</p>
            </div>,
          );
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [data.content, data.fragmentCount, currentFragment]);

  return <div className="slide">{content}</div>;
}
