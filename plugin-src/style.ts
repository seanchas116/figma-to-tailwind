import type * as CSS from "csstype";
import { compact, rgbaToHex, solidPaintToHex } from "./util";

export function positionStyle(
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

export function layoutStyle(node: BaseFrameMixin): string[] {
  const classes: string[] = [];

  if (node.layoutMode === "NONE") {
    return [];
  }

  classes.push("flex");
  if (node.layoutMode === "VERTICAL") {
    classes.push("flex-col");
  }
  classes.push(`gap-[${node.itemSpacing}px]`);
  // style.paddingLeft = Math.max(0, node.paddingLeft - node.strokeWeight) + "px";
  // style.paddingRight =
  //   Math.max(0, node.paddingRight - node.strokeWeight) + "px";
  // style.paddingTop = Math.max(0, node.paddingTop - node.strokeWeight) + "px";
  // style.paddingBottom =
  //   Math.max(0, node.paddingBottom - node.strokeWeight) + "px";
  // TODO: offset border?
  classes.push(`pl-[${node.paddingLeft}px]`);
  classes.push(`pr-[${node.paddingRight}px]`);
  classes.push(`pt-[${node.paddingTop}px]`);
  classes.push(`pb-[${node.paddingBottom}px]`);

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

export function fillBorderStyle(node: BaseFrameMixin): string[] {
  // TODO: A rectangle with single image fill should be treated as <img> rather than <div> with a background image

  // TODO: support multiple fills
  const fill =
    node.fills !== figma.mixed && node.fills.length ? node.fills[0] : undefined;
  const stroke = node.strokes.length ? node.strokes[0] : undefined;

  // TODO: support gradient and image
  const background = fill?.type === "SOLID" ? solidPaintToHex(fill) : undefined;

  const borderColor =
    stroke?.type === "SOLID" ? solidPaintToHex(stroke) : undefined;
  const borderStyle = borderColor ? "solid" : undefined;

  return compact([
    `bg-[${background}]`,
    ...(borderStyle === "solid"
      ? [
          `border-t-[${node.strokeTopWeight}px]`,
          `border-r-[${node.strokeRightWeight}px]`,
          `border-b-[${node.strokeBottomWeight}px]`,
          `border-l-[${node.strokeLeftWeight}px]`,
          `border-[${borderColor}]`,
        ]
      : []),
    node.topLeftRadius !== 0
      ? `rounded-tl-[${node.topLeftRadius}px]`
      : undefined,
    node.topRightRadius !== 0
      ? `rounded-tr-[${node.topRightRadius}px]`
      : undefined,
    node.bottomRightRadius !== 0
      ? `rounded-br-[${node.bottomRightRadius}px]`
      : undefined,
    node.bottomLeftRadius !== 0
      ? `rounded-bl-[${node.bottomLeftRadius}px]`
      : undefined,
  ]);
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

function fontNameStyle(font: FontName): string[] {
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

export function textStyle(node: TextNode): string[] {
  // TODO: split into spans when font styles are mixed
  const fontSize = node.getRangeFontSize(0, 1);
  const fontName = node.getRangeFontName(0, 1);

  const classes: string[] = [];

  classes.push(`text-${textAlign(node.textAlignHorizontal)}`);

  if (fontSize !== figma.mixed) {
    classes.push(`text-[${fontSize}px]`);
  }
  if (fontName !== figma.mixed) {
    classes.push(...fontNameStyle(fontName));
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

export function effectStyle(node: BlendMixin): string[] {
  return compact([
    node.opacity !== 1 ? `opacity-[${node.opacity}]` : undefined,
  ]);
}
