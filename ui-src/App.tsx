import { MessageToPlugin, MessageToUI } from "../message";
import { Buffer } from "buffer";
import { useEffect, useRef, useState } from "react";
import React from "react";
import Prism from "prismjs";
import "./main.css";
import "prism-themes/themes/prism-material-dark.css";

function postMessageToPlugin(data: MessageToPlugin): void {
  parent.postMessage({ pluginMessage: data }, "*");
}

export const App: React.FC = () => {
  let htmlToCopyRef = useRef<string | undefined>();
  const [result, setResult] = useState("");

  useEffect(() => {
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
        setResult(msg.data);
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
    <div className="p-4 flex flex-col gap-4">
      <button
        className="bg-blue-500 text-white leading-[40px] h-[40px] rounded w-full"
        disabled={!result}
        onClick={onCopyButtonClick}
      >
        Copy
      </button>
      <pre>
        <code
          className="language-javascript"
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(
              result,
              Prism.languages.javascript,
              "javascript"
            ),
          }}
        />
      </pre>
    </div>
  );
};
