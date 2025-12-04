import chalk from "chalk";
import { execa } from "execa";

export async function getItems(parentId: string) {
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
    return items;
  } catch (err: any) {
    console.error(
      chalk.red("gdrive files list failed:"),
      err?.stderr ?? err?.message ?? String(err),
    );
    throw new Error("failed to get items");
  }
}
