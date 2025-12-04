import chalk from "chalk";
import { getInfo } from "./getInfo";

export const showFileInfo = async (id: string) => {
  try {
    const fileInfo = await getInfo(id);
    if (fileInfo) {
      console.info(chalk.blue("File Info:"));
      for (const [key, val] of Object.entries(fileInfo)) {
        console.info(`${chalk.yellow(key)}: ${val}`);
      }
      return;
    }
    console.error(chalk.red("Failed to get file info."));
    return;
  } catch (err: any) {
    console.error(
      chalk.red("Failed to get file info:"),
      err?.message ?? String(err),
    );
    return;
  }
};
