import { ensureFolderId } from "../utils/ensureFolderId";
import { ensureGdrive } from "../utils/ensureGdrive";
import { handleFile } from "../utils/handleFile";
import { handleFolder } from "../utils/handleFolder";
export type BrowseNode = { id: string; name: string };

export const browse = async (folderId: any) => {
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
};
