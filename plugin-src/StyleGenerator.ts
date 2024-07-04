import type * as CSS from "csstype";
import { compact, parseFontName, rgbaToHex, solidPaintToHex } from "./util";
import resolveConfig from "tailwindcss/resolveConfig";
import defaultConfig from "tailwindcss/defaultConfig";
import { CodeGenerationOptions } from "../message";
const defaultTheme = resolveConfig(defaultConfig).theme!;
console.log(defaultTheme);

function flattenTheme(theme: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};

  function flatten(obj: Record<string, any>, prefix: string = "") {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "object") {
        flatten(value, `${prefix}${key}-`);
      } else {
        result[`${prefix}${key}`] = value;
      }
    }
  }

  flatten(theme);
  return result;
}

export class StyleGenerator {
  readonly theme = defaultTheme;
  readonly options: CodeGenerationOptions;

  constructor(options: CodeGenerationOptions) {
    this.options = options;

    for (const [keyword, value] of Object.entries(this.theme.spacing ?? {})) {
      this.spacingKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(
      this.theme.lineHeight ?? {}
    )) {
      this.lineHeightKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(
      this.theme.letterSpacing ?? {}
    )) {
      this.letterSpacingKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(
      this.theme.fontWeight ?? {}
    )) {
      this.fontWeightKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(this.theme.fontSize ?? {})) {
      this.fontSizeKeywords.set(value[0], keyword);
    }

    for (const [keyword, value] of Object.entries(
      this.theme.borderWidth ?? {}
    )) {
      this.borderWidthKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(
      this.theme.borderRadius ?? {}
    )) {
      this.borderRadiusKeywords.set(value, keyword);
    }

    for (const [keyword, value] of Object.entries(
      flattenTheme(this.theme.colors ?? {})
    )) {
      // TODO: normalize hex
      this.colorKeywords.set(value.toLowerCase(), keyword);
    }
  }

  private spacingKeywords = new Map<string, string>();
  private lineHeightKeywords = new Map<string, string>();
  private letterSpacingKeywords = new Map<string, string>();
  private fontWeightKeywords = new Map<string, string>();
  private fontSizeKeywords = new Map<string, string>();
  private borderWidthKeywords = new Map<string, string>();
  private borderRadiusKeywords = new Map<string, string>();
  private colorKeywords = new Map<string, string>();

  private spacing(value: number): string {
    if (value === 0) {
      return "-0";
    }
    return this.keywordOrJIT(this.spacingKeywords, `${value / 16}rem`);
  }

  private lineHeightPx(value: number): string {
    return this.keywordOrJIT(this.lineHeightKeywords, `${value / 16}rem`);
  }

  private lineHeightPercent(value: number): string {
    return this.keywordOrJIT(this.lineHeightKeywords, `${value / 100}`);
  }

  private letterSpacingPercent(value: number): string {
    return this.keywordOrJIT(this.letterSpacingKeywords, `${value / 100}em`);
  }

  private fontWeight(value: number): string {
    return this.keywordOrJIT(this.fontWeightKeywords, `${value}`);
  }

  private fontSize(value: number): string {
    return this.keywordOrJIT(this.fontSizeKeywords, `${value / 16}rem`);
  }

  private borderWidth(value: number): string {
    return this.keywordOrJIT(this.borderWidthKeywords, `${value}px`);
  }

  private borderRadius(value: number): string {
    return this.keywordOrJIT(this.borderRadiusKeywords, `${value / 16}rem`);
  }

  private color(hex: string): string {
    hex = hex.toLowerCase();

    if (hex === "#ffffff") {
      return "-white";
    }
    if (hex === "#000000") {
      return "-black";
    }
    if (hex.length === 9 && hex.endsWith("00")) {
      return "-transparent";
    }

    return this.keywordOrJIT(this.colorKeywords, hex);
  }

  private keywordOrJIT(keywords: Map<string, string>, value: string): string {
    const keyword = keywords.get(value);
    if (keyword === "DEFAULT") {
      return "";
    }
    if (keyword) {
      return `-${keyword}`;
    }
    return `-[${value}]`;
  }

  positionClasses(
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
      classes.push(`left${this.spacing(node.x - groupTopLeft.x)}`);
      classes.push(`top${this.spacing(node.y - groupTopLeft.y)}`);
    } else {
      classes.push("relative");
    }

    let widthClass: string | undefined = `w${this.spacing(node.width)}`;
    let heightClass: string | undefined = `h${this.spacing(node.height)}`;

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

    if ("clipsContent" in node && node.clipsContent) {
      classes.push("overflow-hidden");
    }

    return classes;
  }

  layoutClasses(node: BaseFrameMixin): string[] {
    const classes: string[] = [];

    if (node.layoutMode === "NONE") {
      return [];
    }

    classes.push("flex");
    if (node.layoutMode === "VERTICAL") {
      classes.push("flex-col");
    }

    if (node.itemSpacing) {
      classes.push(`gap${this.spacing(node.itemSpacing)}`);
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
      if (node.paddingTop) classes.push(`p${this.spacing(node.paddingTop)}`);
    } else {
      if (node.paddingTop === node.paddingBottom) {
        if (node.paddingTop) classes.push(`py${this.spacing(node.paddingTop)}`);
      } else {
        if (node.paddingTop) classes.push(`pt${this.spacing(node.paddingTop)}`);
        if (node.paddingRight)
          classes.push(`pr${this.spacing(node.paddingRight)}`);
      }

      if (node.paddingLeft === node.paddingRight) {
        if (node.paddingLeft)
          classes.push(`px${this.spacing(node.paddingLeft)}`);
      } else {
        if (node.paddingBottom)
          classes.push(`pb${this.spacing(node.paddingBottom)}`);
        if (node.paddingLeft)
          classes.push(`pl${this.spacing(node.paddingLeft)}`);
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

    return classes;
  }

  borderClasses(node: BaseFrameMixin | RectangleNode): string[] {
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
          classes.push(`border${this.borderWidth(node.strokeTopWeight)}`);
        }
      } else {
        if (node.strokeTopWeight) {
          classes.push(`border-t${this.borderWidth(node.strokeTopWeight)}`);
        }
        if (node.strokeBottomWeight) {
          classes.push(`border-b${this.borderWidth(node.strokeBottomWeight)}`);
        }
        if (node.strokeLeftWeight) {
          classes.push(`border-l${this.borderWidth(node.strokeLeftWeight)}`);
        }
        if (node.strokeRightWeight) {
          classes.push(`border-r${this.borderWidth(node.strokeRightWeight)}`);
        }
      }
      if (borderColor) {
        classes.push(`border${this.color(borderColor)}`);
      }
    }

    if (
      node.topLeftRadius === node.topRightRadius &&
      node.topLeftRadius === node.bottomLeftRadius &&
      node.topLeftRadius === node.bottomRightRadius
    ) {
      if (node.topLeftRadius) {
        classes.push(`rounded${this.borderRadius(node.topLeftRadius)}`);
      }
    } else {
      if (node.topLeftRadius) {
        classes.push(`rounded-tl${this.borderRadius(node.topLeftRadius)}`);
      }
      if (node.topRightRadius) {
        classes.push(`rounded-tr${this.borderRadius(node.topRightRadius)}`);
      }
      if (node.bottomLeftRadius) {
        classes.push(`rounded-bl${this.borderRadius(node.bottomLeftRadius)}`);
      }
      if (node.bottomRightRadius) {
        classes.push(`rounded-br${this.borderRadius(node.bottomRightRadius)}`);
      }
    }

    return classes;
  }

  fillClasses(node: BaseFrameMixin): string[] {
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
      classes.push(`bg${this.color(background)}`);
    }

    return classes;
  }

  private fontNameClasses(font: FontName): string[] {
    const { family, weight, italic } = parseFontName(font);

    return compact([
      this.options.emitsFontFamily
        ? `font-['${family.replace(/\s+/g, "_")}']`
        : undefined,
      `font${this.fontWeight(weight)}`,
      italic ? "italic" : undefined,
    ]);
  }

  textClasses(node: TextNode): string[] {
    // TODO: split into spans when font styles are mixed
    const fontSize = node.getRangeFontSize(0, 1);
    const fontName = node.getRangeFontName(0, 1);

    const classes: string[] = [];

    classes.push(
      (() => {
        switch (node.textAlignHorizontal) {
          case "CENTER":
            return "text-center";
          case "JUSTIFIED":
            return "text-justify";
          case "LEFT":
            return "text-left";
          case "RIGHT":
            return "text-right";
        }
      })()
    );

    if (fontSize !== figma.mixed) {
      classes.push(`text${this.fontSize(fontSize)}`);
    }
    if (fontName !== figma.mixed) {
      classes.push(...this.fontNameClasses(fontName));
    }

    const fills = node.fills;
    if (fills !== figma.mixed && fills.length && fills[0].type === "SOLID") {
      const textColor = rgbaToHex({
        ...fills[0].color,
        a: fills[0].opacity ?? 1,
      });
      classes.push(`text${this.color(textColor)}`);
    }

    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== "AUTO") {
      if (node.lineHeight.unit === "PERCENT") {
        classes.push(`leading${this.lineHeightPercent(node.lineHeight.value)}`);
      } else {
        classes.push(`leading${this.lineHeightPx(node.lineHeight.value)}`);
      }
    }

    const { letterSpacing } = node;
    if (letterSpacing !== figma.mixed && letterSpacing.value !== 0) {
      if (letterSpacing.unit === "PERCENT") {
        classes.push(
          `tracking${this.letterSpacingPercent(letterSpacing.value)}`
        );
      } else if (letterSpacing.unit === "PIXELS") {
        classes.push(`tracking[${letterSpacing.value}px]`);
      }
    }

    return classes;
  }

  effectClasses(node: BlendMixin): string[] {
    return compact([
      node.opacity !== 1 ? `opacity-[${node.opacity}]` : undefined,
    ]);
  }
}
