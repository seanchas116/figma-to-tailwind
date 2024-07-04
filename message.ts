import type * as hast from "hast";
import * as v from "valibot";

export const CodeGenerationOptions = v.object({
  emitsFontFamily: v.optional(v.boolean()),
  emitsLayerName: v.optional(v.boolean()),
  colorNaming: v.optional(
    v.object({
      enabled: v.optional(v.boolean()),
      prefix: v.optional(v.string()),
      autoKebab: v.optional(v.boolean()),
    })
  ),
});
export type CodeGenerationOptions = v.InferOutput<typeof CodeGenerationOptions>;

export type MessageToPlugin =
  | {
      type: "ready";
    }
  | {
      type: "notify";
      data: string;
    }
  | {
      type: "setOptions";
      options: CodeGenerationOptions;
    };

export type MessageToUI =
  | {
      type: "change";
      data: hast.Root;
      sizes: {
        width: number;
        height: number;
      }[];
    }
  | {
      type: "getOptions";
      options: CodeGenerationOptions;
    };
