import prettier from "prettier/standalone";
import parserBabel from "prettier/parser-babel";

export function formatJS(value: string): string {
  return prettier.format(value, {
    parser: "babel",
    plugins: [parserBabel],
  });
}
