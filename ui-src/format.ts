import type { Options } from "prettier";
import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";
import parserHtml from "prettier/parser-html";

const commonOptions: Options = {
  printWidth: 1000,
};

export function formatJS(value: string): string {
  return prettier.format(value, {
    ...commonOptions,
    parser: "babel",
    plugins: [parserBabel],
  });
}

export function formatHTML(value: string): string {
  return prettier.format(value, {
    ...commonOptions,
    parser: "html",
    plugins: [parserHtml],
  });
}
