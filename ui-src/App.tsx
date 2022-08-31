import { MessageToPlugin, MessageToUI } from "../message";
import { Buffer } from "buffer";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import React from "react";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "./main.css";
import "prism-themes/themes/prism-material-dark.css";
import { formatHTML } from "./format";
import { toHtml } from "hast-util-to-html";
import { startCase } from "lodash-es";
import clsx from "clsx";

function postMessageToPlugin(data: MessageToPlugin): void {
  parent.postMessage({ pluginMessage: data }, "*");
}

export const App: React.FC = () => {
  let htmlToCopyRef = useRef<string | undefined>();
  const [htmlOutput, setHTMLOutput] = useState("");
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [tab, setTab] = useState<"code" | "preview">("code");

  useEffect(() => {
    const onDocumentCopy = (e: ClipboardEvent) => {
      if (htmlToCopyRef.current) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", htmlToCopyRef.current);
        htmlToCopyRef.current = undefined;
      }
    };

    const onWindowMessage = (e: MessageEvent) => {
      const msg: MessageToUI = e.data.pluginMessage;

      if (msg.type === "change") {
        const root = msg.data;
        const html = toHtml(root).replaceAll("&#x27;", "'");

        let width = 0;
        let height = 0;
        for (const size of msg.sizes) {
          width = Math.max(width, size.width);
          height += size.height;
        }

        setHTMLOutput(formatHTML(html));
        setContentSize({ width, height });
      }
    };

    window.addEventListener("message", onWindowMessage);
    document.addEventListener("copy", onDocumentCopy);

    postMessageToPlugin({
      type: "ready",
    });

    return () => {
      window.removeEventListener("message", onWindowMessage);
      document.removeEventListener("copy", onDocumentCopy);
    };
  }, []);

  const onCopyButtonClick = () => {
    htmlToCopyRef.current = htmlOutput;
    document.execCommand("copy");

    postMessageToPlugin({
      type: "notify",
      data: "Copied to clipboard. Paste in Macaron",
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-screen w-screen">
      <div className="flex gap-1 -mx-1">
        {(["code", "preview"] as const).map((_tab) => (
          <button
            key={_tab}
            className={clsx("px-1 leading-4 text-sm", {
              "text-gray-900": _tab === tab,
              "text-gray-300": _tab !== tab,
            })}
            onClick={() => setTab(_tab)}
          >
            {startCase(_tab)}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 relative">
        <pre
          className={clsx(
            "rounded overflow-y-scroll bg-gray-800",
            "absolute top-0 left-0 right-0 bottom-0",
            {
              "opacity-0 pointer-events-none": tab !== "code",
            }
          )}
          hidden={tab !== "code"}
        >
          <code
            className="language-jsx"
            style={{
              display: "block",
              padding: "1rem",
              whiteSpace: "pre-wrap",
              fontSize: "10px",
              background: "none",
              fontFamily:
                "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace",
            }}
            dangerouslySetInnerHTML={{
              __html: Prism.highlight(htmlOutput, Prism.languages.jsx, "jsx"),
            }}
          />
        </pre>
        <div
          className={clsx(
            "rounded border border-gray-200 overflow-hidden",
            "absolute top-0 left-0 right-0 bottom-0",
            {
              "opacity-0 pointer-events-none": tab !== "preview",
            }
          )}
        >
          <Preview htmlOutput={htmlOutput} contentSize={contentSize} />
        </div>
      </div>
      <button
        className="bg-blue-500 text-white text-sm leading-10 h-10 rounded w-full"
        disabled={!htmlOutput}
        onClick={onCopyButtonClick}
      >
        Copy
      </button>
    </div>
  );
};

const Preview: React.FC<{
  htmlOutput: string;
  contentSize: { width: number; height: number };
}> = ({ htmlOutput, contentSize }) => {
  const ref = React.createRef<HTMLDivElement>();

  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (ref.current) {
      setViewSize({
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      });
    }
  }, []);

  console.log(contentSize);

  const srcdoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      ${htmlOutput}
    </body>
    </html>
  `;

  const scale = Math.min(
    viewSize.width / contentSize.width,
    viewSize.height / contentSize.height
  );

  return (
    <div
      ref={ref}
      className="w-full h-full"
      style={{
        background: `repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 50% / 20px 20px`,
      }}
    >
      <iframe
        style={{
          width: `${contentSize.width}px`,
          height: `${contentSize.height}px`,
          transformOrigin: "top left",
          transform: `
            translate(${viewSize.width / 2}px, ${viewSize.height / 2}px)
            scale(${scale})
            translate(-${contentSize.width / 2}px, -${
            contentSize.height / 2
          }px)`,
        }}
        srcDoc={srcdoc}
      />
    </div>
  );
};
