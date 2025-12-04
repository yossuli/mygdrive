import chalk from "chalk";
import { execa } from "execa";

const INFO_KNOWN_KEYS = [
  "id",
  "name",
  "mime",
  "mimeType",
  "created",
  "modified",
  "shared",
  "parents",
  "viewUrl",
  "webViewLink",
] as const;

type INFO_KNOWN_KEYS_TYPE = (typeof INFO_KNOWN_KEYS)[number];
type Info<T extends string = INFO_KNOWN_KEYS_TYPE> = {
  [K in T]: K extends "shared"
    ? boolean
    : K extends "parents"
      ? string[]
      : string;
};

const isKnownKey = (key: string): key is INFO_KNOWN_KEYS_TYPE => {
  return (INFO_KNOWN_KEYS as readonly string[]).includes(key);
};

const buildInfoField = (acc: Info, line: string) => {
  const m = line.match(/^([^:]+):\s*(.*)$/);
  if (!m) {
    return acc;
  }
  const key = m[1].trim().toLowerCase();
  const val = m[2].trim();
  if (!isKnownKey(key)) {
    return acc;
  }
  if (key === "shared") {
    return { ...acc, [key]: /true/i.test(val) };
  }

  if (key === "parents") {
    return { ...acc, [key]: val.split(",").map((s) => s.trim()) };
  }

  return { ...acc, [key]: val };
};

export async function getInfo(id: string) {
  try {
    const { stdout } = await execa("gdrive", ["files", "info", id]);

    return stdout.split(/\r?\n/).reduce(buildInfoField, {} as Info);
  } catch (err: any) {
    console.error(
      chalk.red("failed to get info:"),
      err?.stderr ?? err?.message ?? String(err),
    );
    throw new Error("failed to get info");
  }
}
