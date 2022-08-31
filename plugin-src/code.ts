import { figmaToMacaron } from "./traverse";
import { compact } from "lodash-es";
import { toHtml } from "hast-util-to-html";
import { IDGenerator } from "./util";
import { MessageToPlugin, MessageToUI } from "../message";

figma.showUI(__html__, { width: 600, height: 600 });

async function generateContent() {
  const idGenerator = new IDGenerator();

  const macaronLayers = compact(
    await Promise.all(
      figma.currentPage.selection.map((node) =>
        figmaToMacaron(idGenerator, node, undefined, { x: 0, y: 0 })
      )
    )
  );

  const html = toHtml(macaronLayers);

  const messageToUI: MessageToUI = {
    type: "change",
    data: html,
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
