import chalk from "chalk";
import { getInfo } from "../services/gdrive/index.js";

export const showFileInfo = async (id: string) => {
  const fileInfo = await getInfo(id);
  if (!fileInfo.success) {
    console.error(
      chalk.red(fileInfo.error.type),
      fileInfo.error.message ?? fileInfo.error.originalError,
    );
    return;
  }
  if (fileInfo.data) {
    console.info(chalk.blue("File Info:"));
    for (const [key, val] of Object.entries(fileInfo.data)) {
      console.info(`${chalk.yellow(key)}: ${val}`);
    }
    return;
  }
  console.error(chalk.red("Failed to get file info."));
  return;
};
