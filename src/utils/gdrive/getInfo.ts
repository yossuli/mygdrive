import { execa } from "execa";
import {
  INFO_KNOWN_KEYS,
  type INFO_KNOWN_KEYS_TYPE,
  type Info,
  type Result,
} from "../../types/index.js";
import { failure, success } from "../result/index.js";

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

export async function getInfo(id: string): Promise<Result<Info>> {
  try {
    const { stdout } = await execa("gdrive", ["files", "info", id]);

    return success(stdout.split(/\r?\n/).reduce(buildInfoField, {} as Info));
  } catch (err: any) {
    return failure("GDRIVE_GET_INFO_ERROR", err?.stderr ?? err?.message, err);
  }
}
