import { MessageToPlugin, MessageToUI } from "../message";
import { Buffer } from "buffer";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import React from "react";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "./main.css";
import "prism-themes/themes/prism-material-dark.css";
import { formatHTML, formatJS } from "./format";
import { toHtml } from "hast-util-to-html";
// @ts-ignore
import toJSX from "@mapbox/hast-util-to-jsx";
import { startCase } from "lodash-es";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import dedent from "dedent";

function postMessageToPlugin(data: MessageToPlugin): void {
  parent.postMessage({ pluginMessage: data }, "*");
}

export const App: React.FC = () => {
  let htmlToCopyRef = useRef<string | undefined>();
  const [htmlOutput, setHTMLOutput] = useState("");
  const [jsxOutput, setJSXOutput] = useState("");
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [tab, setTab] = useState<"code" | "preview">("code");
  const [format, setFormat] = useState<"html" | "jsx">("html");
  const [emitsFontFamily, setEmitsFontFamily] = useState(false);
  const [emitsLayerName, setEmitsLayerName] = useState(false);
  const [colorNamingEnabled, setColorNamingEnabled] = useState(false);
  const [colorNamingPrefix, setColorNamingPrefix] = useState("");
  const [colorNamingAutoKebab, setColorNamingAutoKebab] = useState(false);

  const codeOutput = format === "html" ? htmlOutput : jsxOutput;

  useEffect(() => {
    const onDocumentCopy = (e: ClipboardEvent) => {
      if (htmlToCopyRef.current) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", htmlToCopyRef.current);
        htmlToCopyRef.current = undefined;
      }
    };

    const onWindowMessage = async (e: MessageEvent) => {
      const msg: MessageToUI = e.data.pluginMessage;

      switch (msg.type) {
        case "change": {
          const root = msg.data;
          const html = toHtml(root).replaceAll("&#x27;", "'");

          let width = 0;
          let height = 0;
          for (const size of msg.sizes) {
            width = Math.max(width, size.width);
            height += size.height;
          }

          const [formattedHTML, formattedJSX] = await Promise.all([
            formatHTML(html),
            formatJS(toJSX(root)),
          ]);

          setHTMLOutput(formattedHTML);
          setJSXOutput(formattedJSX);
          setContentSize({ width, height });
          break;
        }
        case "getOptions": {
          setColorNamingEnabled(msg.options.colorNaming?.enabled ?? false);
          setColorNamingPrefix(msg.options.colorNaming?.prefix ?? "");
          setColorNamingAutoKebab(msg.options.colorNaming?.autoKebab ?? false);
          setEmitsFontFamily(msg.options.emitsFontFamily ?? false);
          setEmitsLayerName(msg.options.emitsLayerName ?? false);
          break;
        }
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

  // set options
  useEffect(() => {
    postMessageToPlugin({
      type: "setOptions",
      options: {
        emitsFontFamily,
        emitsLayerName,
        colorNaming: {
          enabled: colorNamingEnabled,
          prefix: colorNamingPrefix,
          autoKebab: colorNamingAutoKebab,
        },
      },
    });
  }, [
    emitsFontFamily,
    emitsLayerName,
    colorNamingEnabled,
    colorNamingPrefix,
    colorNamingAutoKebab,
  ]);

  const onCopyButtonClick = () => {
    htmlToCopyRef.current = codeOutput;
    document.execCommand("copy");

    postMessageToPlugin({
      type: "notify",
      data: "Copied to clipboard.",
    });
  };

  const [showsConfig, setShowsConfig] = useState(false);

  return (
    <div className="p-4 flex flex-col gap-4 h-screen w-screen text-xs accent-blue-500">
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
        {tab === "code" && (
          <>
            <select
              className="ml-auto text-sm text-gray-900"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
            >
              {["html", "jsx"].map((_format) => (
                <option key={_format} value={_format}>
                  {_format.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              className="p-1 -my-1 text-base aria-checked:text-blue-500"
              aria-checked={showsConfig}
              onClick={(e) => {
                setShowsConfig(!showsConfig);
              }}
            >
              <Icon icon="material-symbols:settings-outline" />
            </button>
          </>
        )}
      </div>
      {showsConfig && tab === "code" && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={emitsFontFamily}
              onChange={(e) => setEmitsFontFamily(e.target.checked)}
            />
            Font family
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={emitsLayerName}
              onChange={(e) => setEmitsLayerName(e.target.checked)}
            />
            Layer names as comments
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={colorNamingEnabled}
                onChange={(e) => setColorNamingEnabled(e.target.checked)}
              />
              Automatically use named colors for variables / color styles
            </label>
            {colorNamingEnabled && (
              <div className="flex items-center gap-4 pl-4">
                <label className="flex items-center gap-1">
                  Prefix
                  <input
                    type="text"
                    placeholder="prefix-"
                    className="w-20 border border-gray-200 px-1 rounded outline-blue-500"
                    value={colorNamingPrefix}
                    onChange={(e) => setColorNamingPrefix(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={colorNamingAutoKebab}
                    onChange={(e) => setColorNamingAutoKebab(e.target.checked)}
                  />
                  Convert to kebab-case
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {tab === "code" && (
          <pre
            className={"rounded overflow-y-scroll bg-gray-800 h-full"}
            hidden={tab !== "code"}
          >
            <code
              className="language-jsx"
              style={{
                display: "block",
                padding: "1rem",
                whiteSpace: "pre-wrap",
                fontSize: "11px",
                background: "none",
                fontFamily:
                  "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace",
              }}
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(codeOutput, Prism.languages.jsx, "jsx"),
              }}
            />
          </pre>
        )}
        {tab === "preview" && (
          <div
            className={"rounded border border-gray-200 overflow-hidden h-full"}
          >
            <Preview htmlOutput={htmlOutput} contentSize={contentSize} />
          </div>
        )}
      </div>
      <button
        className="bg-blue-500 text-white text-sm leading-8 h-8 rounded w-full"
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
