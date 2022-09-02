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
  } else {
    console.error("TODO: unsupported image data type");
    return undefined;
  }
}

export function toValidCSSIdentifier(original: string): string {
  if (original.length === 0) {
    return "_";
  }
  const result = [...original]
    .map((c) => {
      if (/[a-z0-9-_]/i.test(c)) {
        return c;
      }
      // eslint-disable-next-line no-control-regex
      if (/[^\u0000-\u00A0]/.test(c)) {
        return c;
      }
      return "_";
    })
    .join("");

  if (/^[0-9]/.exec(result)) {
    return "_" + result;
  }
  return result;
}

export function incrementAlphanumeric(str: string): string {
  const numMatches = /[1-9][0-9]*$/.exec(str);
  if (numMatches) {
    const numPart = numMatches[0];
    const strPart = str.slice(0, str.length - numPart.length);

    return `${strPart}${Number.parseInt(numPart) + 1}`;
  }

  return str + "1";
}

export class IDGenerator {
  private ids = new Set<string>();
  maxLength = 20;

  generate(text: string): string {
    let id = toValidCSSIdentifier(text).slice(0, this.maxLength);
    while (this.ids.has(id)) {
      id = incrementAlphanumeric(id);
    }
    this.ids.add(id);
    return id;
  }
}

export function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(Boolean) as T[];
}
