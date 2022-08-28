import "./ui.macaron";
import { MessageToPlugin, MessageToUI } from "../message";
import { Buffer } from "buffer";
import "./main.css";
import { useEffect, useRef, useState } from "react";
import React from "react";

function postMessageToPlugin(data: MessageToPlugin): void {
  parent.postMessage({ pluginMessage: data }, "*");
}

export const App: React.FC = () => {
  let htmlToCopyRef = useRef<string | undefined>();
  const [selectedLayerCount, setSelectedLayerCount] = useState(0);

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
      if (msg.type === "copy") {
        const fragmentString: string = msg.data;
        const base64 = Buffer.from(fragmentString).toString("base64");
        const encoded = `<span data-macaron="${base64}"></span>`;
        htmlToCopyRef.current = encoded;
        document.execCommand("copy");

        postMessageToPlugin({
          type: "notify",
          data: "Copied to clipboard. Paste in Macaron",
        });
      } else if (msg.type === "selectionChange") {
        setSelectedLayerCount(msg.count);
      }
    };

    window.addEventListener("message", onWindowMessage);
    document.addEventListener("copy", onDocumentCopy);

    return () => {
      window.removeEventListener("message", onWindowMessage);
      document.removeEventListener("copy", onDocumentCopy);
    };
  });

  const onCopyButtonClick = () => {
    postMessageToPlugin({ type: "copy" });
  };

  return (
    <div>
      <button disabled={selectedLayerCount === 0} onClick={onCopyButtonClick}>
        Copy Selected Layers
      </button>
      <div>
        {selectedLayerCount === 0
          ? "No layers selected"
          : selectedLayerCount === 1
          ? "1 layer selected"
          : `${selectedLayerCount} layers selected`}
      </div>
    </div>
  );
};
