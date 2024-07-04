import { HTMLGenerator } from "./HTMLGenerator";
import { compact } from "lodash-es";
import {
  CodeGenerationOptions,
  MessageToPlugin,
  MessageToUI,
} from "../message";
import * as v from "valibot";

figma.showUI(__html__, { width: 640, height: 480 });

function getOptions(): CodeGenerationOptions {
  const optionsJSON = figma.root.getPluginData("options");

  if (!optionsJSON) {
    return {};
  }

  try {
    return v.parse(CodeGenerationOptions, JSON.parse(optionsJSON));
  } catch (e) {
    console.error(e);
    return {};
  }
}

function setOptions(options: CodeGenerationOptions): void {
  const optionsJSON = JSON.stringify(options);
  figma.root.setPluginData("options", optionsJSON);
}

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

  const htmlGenerator = new HTMLGenerator(getOptions());

  const macaronLayers = compact(
    await Promise.all(
      selection.map((node) =>
        htmlGenerator.generate(node, undefined, { x: 0, y: 0 })
      )
    )
  );

  postMessageToUI({
    type: "change",
    data: {
      type: "root",
      children: macaronLayers,
    },
    sizes,
  });
}

function postMessageToUI(messageToUI: MessageToUI): void {
  figma.ui.postMessage(messageToUI);
}

figma.ui.onmessage = async (msg: MessageToPlugin) => {
  switch (msg.type) {
    case "ready": {
      postMessageToUI({
        type: "getOptions",
        options: getOptions(),
      });
      await generateContent();
      break;
    }
    case "notify": {
      figma.notify(msg.data);
      break;
    }
    case "setOptions": {
      setOptions(msg.options);
      await generateContent();
      break;
    }
  }
};

figma.on("selectionchange", generateContent);
