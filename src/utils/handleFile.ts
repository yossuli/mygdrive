import { Confirm, Select } from "enquirer";

import type { BrowseNode } from "../cli";
import { downloadFile } from "./downloadFile";
import { showFileInfo } from "./showFileInfo";

export const handleFile = async ({ id, name }: BrowseNode) => {
  const download = { name: "Download" };
  const info = { name: "Info" };
  const back = { name: "Back" };
  const prompt2 = new Select({
    name: "file-action",
    message: `Selected file: ${name} (${id})`,
    choices: [back, download, info],
  });
  const action = await prompt2.run();
  if (action === "Download") {
    const downloadPrompt = new Confirm({
      name: "confirm-download",
      message: `Download file: ${name} (${id})?`,
    });
    const confirmed = await downloadPrompt.run();
    if (confirmed) {
      await downloadFile(id, name);
    }
    return;
  }
  if (action === "Info") {
    await showFileInfo(id);
    return;
  }
};
