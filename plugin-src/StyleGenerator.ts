import type * as CSS from "csstype";
import { compact, rgbaToHex, solidPaintToHex } from "./util";
import resolveConfig from "tailwindcss/resolveConfig";
import defaultConfig from "tailwindcss/defaultConfig";
const defaultTheme = resolveConfig(defaultConfig).theme!;
console.log(defaultTheme);

export class StyleGenerator {
  readonly theme = defaultTheme;

  position(
    node: SceneNode,
    parentLayout: BaseFrameMixin["layoutMode"] | undefined,
    groupTopLeft: { x: number; y: number } = { x: 0, y: 0 }
  ): string[] {
    const classes: string[] = [];

    // TODO: more constraints
    if (
      parentLayout === "NONE" ||
      ("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE")
    ) {
      classes.push("absolute");
      classes.push(`left-[${node.x - groupTopLeft.x}px]`);
      classes.push(`top-[${node.y - groupTopLeft.y}px]`);
    } else {
      classes.push("relative");
    }

    let widthClass: string | undefined = `w-[${node.width}px]`;
    let heightClass: string | undefined = `h-[${node.height}px]`;

    if ("layoutGrow" in node) {
      if (parentLayout === "VERTICAL") {
        if (node.layoutGrow) {
          classes.push("flex-1");
          heightClass = undefined;
        }
        if (node.layoutAlign === "STRETCH") {
          classes.push("self-stretch");
          widthClass = undefined;
        }
      } else if (parentLayout === "HORIZONTAL") {
        if (node.layoutGrow) {
          classes.push("flex-1");
          widthClass = undefined;
        }
        if (node.layoutAlign === "STRETCH") {
          classes.push("self-stretch");
          heightClass = undefined;
        }
      }
    }

    if (node.type === "TEXT") {
      switch (node.textAutoResize) {
        case "WIDTH_AND_HEIGHT":
          widthClass = undefined;
          heightClass = undefined;
          break;
        case "HEIGHT":
          heightClass = undefined;
          break;
        case "NONE":
          break;
      }
    }

    if (widthClass) {
      classes.push(widthClass);
    }
    if (heightClass) {
      classes.push(heightClass);
    }

    return classes;
  }

  layout(node: BaseFrameMixin): string[] {
    const classes: string[] = [];

    if (node.layoutMode === "NONE") {
      return [];
    }

    classes.push("flex");
    if (node.layoutMode === "VERTICAL") {
      classes.push("flex-col");
    }

    if (node.itemSpacing) {
      classes.push(`gap-[${node.itemSpacing}px]`);
    }
    // style.paddingLeft = Math.max(0, node.paddingLeft - node.strokeWeight) + "px";
    // style.paddingRight =
    //   Math.max(0, node.paddingRight - node.strokeWeight) + "px";
    // style.paddingTop = Math.max(0, node.paddingTop - node.strokeWeight) + "px";
    // style.paddingBottom =
    //   Math.max(0, node.paddingBottom - node.strokeWeight) + "px";
    // TODO: offset border?

    if (
      node.paddingTop === node.paddingRight &&
      node.paddingTop === node.paddingBottom &&
      node.paddingTop === node.paddingLeft
    ) {
      if (node.paddingTop) classes.push(`p-[${node.paddingTop}px]`);
    } else {
      if (node.paddingTop === node.paddingBottom) {
        if (node.paddingTop) classes.push(`py-[${node.paddingTop}px]`);
      } else {
        if (node.paddingTop) classes.push(`pt-[${node.paddingTop}px]`);
        if (node.paddingRight) classes.push(`pr-[${node.paddingRight}px]`);
      }

      if (node.paddingLeft === node.paddingRight) {
        if (node.paddingLeft) classes.push(`px-[${node.paddingLeft}px]`);
      } else {
        if (node.paddingBottom) classes.push(`pb-[${node.paddingBottom}px]`);
        if (node.paddingLeft) classes.push(`pl-[${node.paddingLeft}px]`);
      }
    }

    classes.push(
      (() => {
        switch (node.primaryAxisAlignItems) {
          case "CENTER":
            return "justify-center";
          case "MAX":
            return "justify-end";
          case "MIN":
            return "justify-start";
          case "SPACE_BETWEEN":
            return "justify-between";
        }
      })()
    );
    classes.push(
      (() => {
        switch (node.counterAxisAlignItems) {
          case "CENTER":
            return "items-center";
          case "MAX":
            return "items-end";
          case "MIN":
            return "items-start";
          case "BASELINE":
            return "items-baseline";
        }
      })()
    );

    if (node.layoutMode === "VERTICAL") {
      if (node.primaryAxisSizingMode == "AUTO") {
        classes.push(`h-fit`);
      }
      if (node.counterAxisSizingMode == "AUTO") {
        classes.push(`w-fit`);
      }
    } else {
      if (node.primaryAxisSizingMode == "AUTO") {
        classes.push(`w-fit`);
      }
      if (node.counterAxisSizingMode == "AUTO") {
        classes.push(`h-fit`);
      }
    }

    if (node.clipsContent) {
      classes.push("overflow-hidden");
    }

    return classes;
  }

  border(node: BaseFrameMixin | RectangleNode): string[] {
    // TODO: A rectangle with single image fill should be treated as <img> rather than <div> with a background image

    const classes: string[] = [];

    const stroke = node.strokes.length ? node.strokes[0] : undefined;

    const borderColor =
      stroke?.type === "SOLID" ? solidPaintToHex(stroke) : undefined;
    const borderStyle = borderColor ? "solid" : undefined;

    if (borderStyle === "solid") {
      if (
        node.strokeTopWeight === node.strokeBottomWeight &&
        node.strokeTopWeight === node.strokeLeftWeight &&
        node.strokeTopWeight === node.strokeRightWeight
      ) {
        if (node.strokeTopWeight) {
          classes.push(`border-[${node.strokeTopWeight}px]`);
        }
      } else {
        if (node.strokeTopWeight) {
          classes.push(`border-t-[${node.strokeTopWeight}px]`);
        }
        if (node.strokeBottomWeight) {
          classes.push(`border-b-[${node.strokeBottomWeight}px]`);
        }
        if (node.strokeLeftWeight) {
          classes.push(`border-l-[${node.strokeLeftWeight}px]`);
        }
        if (node.strokeRightWeight) {
          classes.push(`border-r-[${node.strokeRightWeight}px]`);
        }
      }
      classes.push(`border-[${borderColor}]`);
    }

    if (
      node.topLeftRadius === node.topRightRadius &&
      node.topLeftRadius === node.bottomLeftRadius &&
      node.topLeftRadius === node.bottomRightRadius
    ) {
      if (node.topLeftRadius) {
        classes.push(`rounded-[${node.topLeftRadius}px]`);
      }
    } else {
      if (node.topLeftRadius) {
        classes.push(`rounded-tl-[${node.topLeftRadius}px]`);
      }
      if (node.topRightRadius) {
        classes.push(`rounded-tr-[${node.topRightRadius}px]`);
      }
      if (node.bottomLeftRadius) {
        classes.push(`rounded-bl-[${node.bottomLeftRadius}px]`);
      }
      if (node.bottomRightRadius) {
        classes.push(`rounded-br-[${node.bottomRightRadius}px]`);
      }
    }

    return classes;
  }

  fill(node: BaseFrameMixin): string[] {
    const classes: string[] = [];

    // TODO: support multiple fills
    const fill =
      node.fills !== figma.mixed && node.fills.length
        ? node.fills[0]
        : undefined;

    // TODO: support gradient and image
    const background =
      fill?.type === "SOLID" ? solidPaintToHex(fill) : undefined;
    if (background) {
      classes.push(`bg-[${background}]`);
    }

    return classes;
  }

  private fontName(font: FontName): string[] {
    const fontFamily = font.family;

    const style = font.style.toLowerCase();
    const styleWithoutItalic = style.replace("italic", "").replace(/\s+/g, "");

    const fontWeight = fontWeightForName[styleWithoutItalic] ?? 400;
    const italic = style.includes("italic");

    return compact([
      `font-['${fontFamily.replace(/\s+/g, "_")}']`,
      `font-[${fontWeight}]`,
      italic ? "italic" : undefined,
    ]);
  }

  text(node: TextNode): string[] {
    // TODO: split into spans when font styles are mixed
    const fontSize = node.getRangeFontSize(0, 1);
    const fontName = node.getRangeFontName(0, 1);

    const classes: string[] = [];

    classes.push(`text-${textAlign(node.textAlignHorizontal)}`);

    if (fontSize !== figma.mixed) {
      classes.push(`text-[${fontSize}px]`);
    }
    if (fontName !== figma.mixed) {
      classes.push(...this.fontName(fontName));
    }

    const fills = node.fills;
    if (fills !== figma.mixed && fills.length && fills[0].type === "SOLID") {
      const textColor = rgbaToHex({
        ...fills[0].color,
        a: fills[0].opacity ?? 1,
      });
      classes.push(`text-[${textColor}]`);
    }

    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== "AUTO") {
      if (node.lineHeight.unit === "PERCENT") {
        classes.push(`leading-[${node.lineHeight.value / 100}]`);
      } else {
        classes.push(`leading-[${node.lineHeight.value}px]`);
      }
    }

    const { letterSpacing } = node;
    if (letterSpacing !== figma.mixed && letterSpacing.value !== 0) {
      if (letterSpacing.unit === "PERCENT") {
        classes.push(`tracking-[${letterSpacing.value / 100}em]`);
      } else if (letterSpacing.unit === "PIXELS") {
        classes.push(`tracking-[${letterSpacing.value}px]`);
      }
    }

    return classes;
  }

  effect(node: BlendMixin): string[] {
    return compact([
      node.opacity !== 1 ? `opacity-[${node.opacity}]` : undefined,
    ]);
  }
}

function textAlign(align: TextNode["textAlignHorizontal"]): string {
  switch (align) {
    case "CENTER":
      return "center";
    case "JUSTIFIED":
      return "justify";
    case "LEFT":
      return "left";
    case "RIGHT":
      return "right";
  }
}

const fontWeightForName: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};
