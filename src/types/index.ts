export type Failed = {
  success: false;
  error: {
    type: string;
    message?: string;
    err?: any;
  };
};

export type Result<T = never> = { success: true; data: T } | Failed;

export type Item = {
  id: string;
  name: string;
  type: string;
  size: string;
  created: string;
};

export const INFO_KNOWN_KEYS = [
  "id",
  "name",
  "mime",
  "size",
  "created",
  "modified",
  "shared",
  "parents",
  "viewUrl",
] as const;

export type INFO_KNOWN_KEYS_TYPE = (typeof INFO_KNOWN_KEYS)[number];
export type Info<T extends string = INFO_KNOWN_KEYS_TYPE> = {
  [K in T]: K extends "shared"
    ? boolean
    : K extends "parents"
      ? string[]
      : string;
};
