import { Select } from "enquirer";
import { confirm } from "./enquirer/confirm";

import type { BrowseNode } from "../cli";
import { downloadFile } from "./downloadFile";
import { showFileInfo } from "./showFileInfo";

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
