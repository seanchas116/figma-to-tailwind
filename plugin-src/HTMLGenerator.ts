import { compact } from "lodash-es";
import type * as hast from "hast";
import { h } from "hastscript";
// @ts-ignore
import * as svgParser from "svg-parser";
import { imageToDataURL, isVectorLikeNode, processCharacters } from "./util";
import { StyleGenerator } from "./StyleGenerator";
import { twMerge } from "tailwind-merge";

export class HTMLGenerator {
  styleGenerator = new StyleGenerator();

  async generate(
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
            this.styleGenerator.position(node, parentLayout, groupTopLeft),
            this.styleGenerator.border(node),
            this.styleGenerator.effect(node)
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
              this.styleGenerator.position(node, parentLayout, groupTopLeft),
              this.styleGenerator.effect(node as BlendMixin)
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
              this.styleGenerator.position(node, parentLayout, groupTopLeft),
              this.styleGenerator.text(node),
              this.styleGenerator.effect(node)
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
              this.styleGenerator.fill(node),
              this.styleGenerator.border(node),
              this.styleGenerator.layout(node),
              this.styleGenerator.position(node, parentLayout, groupTopLeft),
              this.styleGenerator.effect(node)
            ),
          },
          ...compact(
            await Promise.all(
              node.children.map((child) =>
                this.generate(
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
            className: twMerge(
              this.styleGenerator.position(node, parentLayout, groupTopLeft)
            ),
          },
          ...compact(
            await Promise.all(
              node.children.map((child) =>
                this.generate(child, "NONE", {
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
}
