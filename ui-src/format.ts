import type { Options } from "prettier";
import * as prettier from "prettier/standalone";
import * as pluginBabel from "prettier/plugins/babel";
import * as pluginEstree from "prettier/plugins/estree";
import * as pluginPostcss from "prettier/plugins/postcss";
import * as pluginHtml from "prettier/plugins/html";

const commonOptions: Options = {
  printWidth: 1000,
};

export function formatJS(
  value: string,
  options: Options = commonOptions
): Promise<string> {
  return prettier.format(value, {
    ...options,
    parser: "babel",
    plugins: [pluginEstree, pluginBabel],
  });
}

export function formatHTML(
  value: string,
  options: Options = commonOptions
): Promise<string> {
  return prettier.format(value, {
    ...options,
    parser: "html",
    plugins: [pluginHtml, pluginPostcss],
  });
}
