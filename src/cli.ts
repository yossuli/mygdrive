import { Command } from "commander";
import { ensureFolderId } from "./utils/ensureFolderId";
import { ensureGdrive } from "./utils/ensureGdrive";
import { handleFile } from "./utils/handleFile";
import { handleFolder } from "./utils/handleFolder";
export type BrowseNode = { id: string; name: string };

const pkg = { version: "0.1.0" };
const program = new Command();
program
  .name("mygdrive")
  .description("Wrapper for gdrive CLI")
  .version(pkg.version);

program
  .command("browse [folderId]")
  .description("Browse Drive in a simple TUI and download files")
  .action(async (folderId) => {
    await ensureGdrive();

    // initialize current to a sensible default; avoid calling getInfo synchronously here
    let current: BrowseNode = await ensureFolderId(folderId);
    let parents: BrowseNode[] = [];

    while (true) {
      const result = await handleFolder(current, parents);
      result.handleLoop;
      if (result.handleLoop === "break") {
        break;
      }
      if (result.handleLoop === "continue") {
        current = result.current;
        parents = result.parents;
        continue;
      }
      const { id, name } = result;

      await handleFile({ id, name });
    }
  });

program.parse(process.argv);
