import type * as hast from "hast";

export type MessageToPlugin =
  | {
      type: "ready";
    }
  | {
      type: "notify";
      data: string;
    };

export type MessageToUI = {
  type: "change";
  data: hast.Root;
  sizes: {
    width: number;
    height: number;
  }[];
};
