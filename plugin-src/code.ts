import { HTMLGenerator } from "./HTMLGenerator";
import { compact } from "lodash-es";
import { MessageToPlugin, MessageToUI } from "../message";

figma.showUI(__html__, { width: 640, height: 480 });

async function generateContent() {
  const selection = figma.currentPage.selection;

  const sizes = selection.map((node) => {
    if ("width" in node) {
      return {
        width: node.width,
        height: node.height,
      };
    }
    return {
      width: 0,
      height: 0,
    };
  });

  const htmlGenerator = new HTMLGenerator();

  const macaronLayers = compact(
    await Promise.all(
      selection.map((node) =>
        htmlGenerator.generate(node, undefined, { x: 0, y: 0 })
      )
    )
  );

  const messageToUI: MessageToUI = {
    type: "change",
    data: {
      type: "root",
      children: macaronLayers,
    },
    sizes,
  };
  figma.ui.postMessage(messageToUI);
}

figma.ui.onmessage = async (msg: MessageToPlugin) => {
  switch (msg.type) {
    case "ready": {
      await generateContent();
      break;
    }
    case "notify": {
      figma.notify(msg.data);
      break;
    }
  }
};

figma.on("selectionchange", generateContent);
