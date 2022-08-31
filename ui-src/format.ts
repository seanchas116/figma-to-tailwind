import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";
import parserHtml from "prettier/parser-html";

export function formatJS(value: string): string {
  return prettier.format(value, {
    parser: "babel",
    plugins: [parserBabel],
  });
}

export function formatHTML(value: string): string {
  return prettier.format(value, {
    parser: "html",
    plugins: [parserHtml],
  });
}
