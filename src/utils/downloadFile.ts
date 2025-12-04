import chalk from "chalk";
import { execa } from "execa";

export const downloadFile = async (id: string, name: string) => {
  try {
    console.info(chalk.green(`Downloading file: ${name} (${id})...`));
    await execa("gdrive", ["files", "download", id]);
    console.info(chalk.green(`Downloaded file: ${name} (${id})`));
  } catch (err: any) {
    console.error(
      chalk.red("Download failed:"),
      err?.stderr ?? err?.message ?? String(err),
    );
  }
};
