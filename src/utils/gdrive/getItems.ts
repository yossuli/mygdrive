import { execa } from "execa";
import type { Item, Result } from "../../types/index.js";
import { failure, success } from "../result/index.js";

export async function getItems(parentId: string): Promise<Result<Item[]>> {
  if (!parentId) {
    return {
      success: false,
      error: {
        type: "INVALID_PARENT_ID",
        message: "Parent ID is required",
      },
    };
  }
  try {
    const { stdout } = await execa("gdrive", [
      "files",
      "list",
      "--parent",
      parentId,
    ]);
    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const dataLines = lines.filter((ln) => !/^Id\b/.test(ln));
    const items = dataLines.map((line) => {
      const cols = line
        .split(/\s{2,}/)
        .map((c) => c.trim())
        .filter(Boolean);
      const id = cols[0] ?? "";
      const name = cols[1] ?? "";
      const type = cols[2] ?? "";
      const size = cols[3] ?? "";
      const created = cols[4] ?? "";
      return { id, name, type, size, created };
    });
    return success(items);
  } catch (err: any) {
    return failure("GDRIVE_LIST_ERROR", err?.stderr ?? err?.message, err);
  }
}
