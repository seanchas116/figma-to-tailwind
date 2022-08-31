import { MessageToPlugin, MessageToUI } from "../message";
import { Buffer } from "buffer";
import { useEffect, useRef, useState } from "react";
import React from "react";
import Prism from "prismjs";

import "prismjs/components/prism-jsx";
import "./main.css";
import "prism-themes/themes/prism-material-dark.css";
import { formatHTML, formatJS } from "./format";

function postMessageToPlugin(data: MessageToPlugin): void {
  parent.postMessage({ pluginMessage: data }, "*");
}

export const App: React.FC = () => {
  let htmlToCopyRef = useRef<string | undefined>();
  const [result, setResult] = useState("");

  const iframeRef = React.createRef<HTMLIFrameElement>();

  useEffect(() => {
    const iframe = iframeRef.current;

    const onDocumentCopy = (e: ClipboardEvent) => {
      if (htmlToCopyRef.current) {
        e.preventDefault();
        e.clipboardData?.setData("text/html", htmlToCopyRef.current);
        htmlToCopyRef.current = undefined;
      }
    };

    const onWindowMessage = (e: MessageEvent) => {
      const msg: MessageToUI = e.data.pluginMessage;
      if (msg.type === "change") {
        if (iframe) {
          console.log("change srcdoc");
          iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">  
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
              ${msg.data}
            </body>
            </html>
          `;
        }

        setResult(formatHTML(msg.data));
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
    const base64 = Buffer.from(result).toString("base64");
    const encoded = `<span data-macaron="${base64}"></span>`;
    htmlToCopyRef.current = encoded;
    document.execCommand("copy");

    postMessageToPlugin({
      type: "notify",
      data: "Copied to clipboard. Paste in Macaron",
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-screen w-screen">
      <button
        className="bg-blue-500 text-white leading-[40px] h-[40px] rounded w-full"
        disabled={!result}
        onClick={onCopyButtonClick}
      >
        Copy
      </button>
      <div className="grid grid-cols-2 flex-1 min-h-0">
        <pre className="rounded overflow-y-scroll h-full bg-gray-800">
          <code
            className="language-jsx"
            style={{
              display: "block",
              padding: "1rem",
              whiteSpace: "pre-wrap",
              fontSize: "12px",
              background: "none",
              fontFamily:
                "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace",
            }}
            dangerouslySetInnerHTML={{
              __html: Prism.highlight(result, Prism.languages.jsx, "jsx"),
            }}
          />
        </pre>
        <div>
          <iframe className="w-full h-full" ref={iframeRef} />
        </div>
      </div>
    </div>
  );
};
