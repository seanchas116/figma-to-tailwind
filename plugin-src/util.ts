import type * as hast from "hast";
import { h } from "hastscript";
import { Buffer } from "buffer";

const lineBreakRegExp = /\r\n|[\n\r\u2028\u2029\u0085]/;

export function processCharacters(characters: string): hast.Content[] {
  const lines = characters.split(lineBreakRegExp);
  const results: hast.Content[] = [];
  for (let i = 0; i < lines.length; ++i) {
    if (i !== 0) {
      results.push(h("br"));
    }
    results.push({
      type: "text",
      value: lines[i],
    });
  }
  return results;
}

export function solidPaintToHex(solidPaint: SolidPaint): string {
  return rgbaToHex({ ...solidPaint.color, a: solidPaint.opacity ?? 1 });
}

export function rgbaToHex(rgba: RGBA): string {
  const { r, g, b, a } = rgba;
  return (
    "#" +
    (a === 1 ? [r, g, b] : [r, g, b, a])
      .map((c) => {
        const str = Math.round(c * 255)
          .toString(16)
          .toUpperCase();
        return str.length === 1 ? "0" + str : str;
      })
      .join("")
  );
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
  w1: 100,
  w2: 200,
  w3: 300,
  w4: 400,
  w5: 500,
  w6: 600,
  w7: 700,
  w8: 800,
  w9: 900,
};

export function parseFontName(font: FontName): {
  family: string;
  weight: number;
  italic: boolean;
} {
  const style = font.style.toLowerCase();
  const styleWithoutItalic = style.replace("italic", "").replace(/\s+/g, "");

  const weight = fontWeightForName[styleWithoutItalic] ?? 400;
  const italic = style.includes("italic");

  return {
    family: font.family,
    weight,
    italic,
  };
}

export function svgToDataURL(svgText: string): string {
  const encoded = encodeURIComponent(svgText)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml,${encoded}`;
}

export function imageToDataURL(data: Uint8Array): string | undefined {
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e) {
    const base64 = Buffer.from(data).toString("base64");
    return "data:image/png;base64," + base64;
  } else if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    const base64 = Buffer.from(data).toString("base64");
    return "data:image/jpeg;base64," + base64;
  } else {
    console.error("TODO: unsupported image data type");
    return undefined;
  }
}

export function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(Boolean) as T[];
}

function variableToColorName(variable: Variable): string | undefined {
  if (variable.resolvedType !== "COLOR") {
    return;
  }
  return variable.codeSyntax.WEB ?? variable.name;
}

export function getStrokeColorName(node: MinimalStrokesMixin) {
  if (node.strokeStyleId) {
    const style = figma.getStyleById(node.strokeStyleId);
    if (style && style.type === "PAINT") {
      return style.name;
    }
  }
  const stroke = node.strokes.length ? node.strokes[0] : undefined;
  if (stroke?.type === "SOLID" && stroke.boundVariables?.color) {
    const boundVariable = stroke.boundVariables.color;
    if (boundVariable) {
      const variable = figma.variables.getVariableById(boundVariable.id);
      if (variable) {
        return variableToColorName(variable);
      }
    }
  }
}

export function getFillColorName(node: MinimalFillsMixin) {
  if (typeof node.fillStyleId === "string") {
    const style = figma.getStyleById(node.fillStyleId);
    if (style && style.type === "PAINT") {
      return style.name;
    }
  }

  // TODO: support multiple fills
  const fill =
    node.fills !== figma.mixed && node.fills.length ? node.fills[0] : undefined;

  if (fill?.type === "SOLID" && fill.boundVariables?.color) {
    const boundVariable = fill.boundVariables.color;
    if (boundVariable) {
      const variable = figma.variables.getVariableById(boundVariable.id);
      if (variable) {
        return variableToColorName(variable);
      }
    }
  }
}
