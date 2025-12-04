import { ensureGdrive } from "../services/gdrive/index.js";
import { ensureFolderId } from "../utils/ensureFolderId.js";
import { handleFile } from "../utils/handleFile.js";
import { handleFolder } from "../utils/handleFolder.js";
export type BrowseNode = { id: string; name: string };

export const browse = async (folderId: any) => {
  await ensureGdrive();

  // initialize current to a sensible default; avoid calling getInfo synchronously here
  let current: BrowseNode = await ensureFolderId(folderId);
  let parents: BrowseNode[] = [];

  while (true) {
    const handled = await handleFolder(current, parents);
    handled.handleLoop;
    if (handled.handleLoop === "break") {
      break;
    }
    if (handled.handleLoop === "continue") {
      current = handled.current;
      parents = handled.parents;
      continue;
    }
    const { id, name } = handled;

    await handleFile({ id, name });
  }
};
