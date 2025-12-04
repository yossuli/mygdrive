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

interface Break {
  handleLoop: "break";
}
interface Continue {
  handleLoop: "continue";
  current: BrowseNode;
  parents: BrowseNode[];
}

const browse = async (
  current: BrowseNode,
  parents: BrowseNode[],
): Promise<Break | Continue> => {
  const result = await handleFolder(current, parents);
  result.handleLoop;
  if (result.handleLoop === "break") {
    return { handleLoop: "break" };
  }
  if (result.handleLoop === "continue") {
    return result;
  }
  const { id, name } = result;

  await handleFile({ id, name });

  return {
    handleLoop: "continue",
    current,
    parents,
  };
};

program
  .command("browse [folderId]")
  .description("Browse Drive in a simple TUI and download files")
  .action(async (folderId) => {
    await ensureGdrive();

    // initialize current to a sensible default; avoid calling getInfo synchronously here
    let current: BrowseNode = await ensureFolderId(folderId);
    let parents: BrowseNode[] = [];

    while (true) {
      const result = await browse(current, parents);
      if (result.handleLoop === "break") {
        break;
      }
      current = result.current;
      parents = result.parents;
    }
  });

program.parse(process.argv);
