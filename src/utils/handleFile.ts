import type { BrowseNode } from "../commands/browse.js";
import { confirm } from "./enquirer/confirm.js";
import { downloadFile } from "./gdrive/index.js";
import { showFileInfo } from "./showFileInfo.js";

import pkg from "enquirer";
const { Select } = pkg;

const download = { name: "Download" };
const info = { name: "Info" };
const back = { name: "Back" };

export const handleFile = async ({ id, name }: BrowseNode) => {
  while (true) {
    const prompt2 = new Select({
      name: "file-action",
      message: `Selected file: ${name} (${id})`,
      choices: [back, download, info],
    });
    const action = await prompt2.run();
    if (action === "Download") {
      const options = {
        name: "confirm-download",
        message: `Are you sure you want to download "${name}" (${id})?`,
      };
      const isDownloadConfirmed = await confirm(options, async () => {
        await downloadFile(id, name);
        return true;
      });
      if (isDownloadConfirmed) {
        break;
      }
      continue;
    }
    if (action === "Back") {
      break;
    }
    await showFileInfo(id);
  }
};
