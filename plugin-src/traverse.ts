import { compact } from "lodash-es";
import type * as hast from "hast";
import { h } from "hastscript";
// @ts-ignore
import * as svgParser from "svg-parser";
import {
  imageToDataURL,
  isVectorLikeNode,
  processCharacters,
  IDGenerator,
} from "./util";
import {
  positionStyle,
  effectStyle,
  fillStyle,
  textStyle,
  layoutStyle,
  borderStyle,
} from "./style";
import { twMerge } from "tailwind-merge";

export async function figmaToMacaron(
  node: SceneNode,
  parentLayout: BaseFrameMixin["layoutMode"] | undefined,
  groupTopLeft: Vector = { x: 0, y: 0 }
): Promise<hast.Content | undefined> {
  if (!node.visible) {
    // TODO: support visibility
    return undefined;
  }

  // ignore mask layers
  if ("isMask" in node && node.isMask) {
    return undefined;
  }

  // Image like node
  if (
    node.type == "RECTANGLE" &&
    node.fills !== figma.mixed &&
    node.fills.length
  ) {
    const fill = node.fills[0];
    if (fill.type === "IMAGE" && fill.imageHash) {
      const image = figma.getImageByHash(fill.imageHash);
      const dataURL = image
        ? imageToDataURL(await image.getBytesAsync())
        : undefined;

      return h("img", {
        src: dataURL,
        className: twMerge(
          positionStyle(node, parentLayout, groupTopLeft),
          borderStyle(node),
          effectStyle(node)
        ),
      });
    }
  }

  if (isVectorLikeNode(node)) {
    try {
      const svg = await node.exportAsync({ format: "SVG" });
      const svgText = String.fromCharCode(...svg);

      const root = svgParser.parse(svgText) as hast.Root;
      const svgElem = root.children[0];
      if (svgElem.type !== "element") {
        throw new Error("Expected element type");
      }

      return {
        ...svgElem,
        properties: {
          ...svgElem.properties,
          className: twMerge(
            positionStyle(node, parentLayout, groupTopLeft),
            effectStyle(node as BlendMixin)
          ),
        },
      };
    } catch (error) {
      console.error(`error exporting ${node.name} to SVG`);
      console.error(String(error));
    }
  }

  switch (node.type) {
    case "TEXT": {
      return h(
        "div",
        {
          className: twMerge(
            positionStyle(node, parentLayout, groupTopLeft),
            textStyle(node),
            effectStyle(node)
          ),
        },
        ...processCharacters(node.characters)
      );
    }
    case "COMPONENT":
    case "COMPONENT_SET":
    case "INSTANCE":
    case "FRAME": {
      return h(
        "div",
        {
          className: twMerge(
            fillStyle(node),
            borderStyle(node),
            layoutStyle(node),
            positionStyle(node, parentLayout, groupTopLeft),
            effectStyle(node)
          ),
        },
        ...compact(
          await Promise.all(
            node.children.map((child) =>
              figmaToMacaron(
                child,
                node.layoutMode,
                node.strokes.length
                  ? {
                      x: node.strokeLeftWeight,
                      y: node.strokeTopWeight,
                    }
                  : { x: 0, y: 0 }
              )
            )
          )
        )
      );
    }
    case "GROUP": {
      return h(
        "div",
        {
          className: twMerge(positionStyle(node, parentLayout, groupTopLeft)),
        },
        ...compact(
          await Promise.all(
            node.children.map((child) =>
              figmaToMacaron(child, "NONE", {
                x: node.x,
                y: node.y,
              })
            )
          )
        )
      );
    }
    default:
      console.log("ignoring", node.type);
      return undefined;
  }
}
