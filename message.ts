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
  data: string;
};
