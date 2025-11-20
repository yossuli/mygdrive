#!/usr/bin/env node

import { Command } from "commander";
import { execa } from "execa";
import chalk from "chalk";

const pkg = { version: "0.1.0" };
const program = new Command();
program
  .name("mygdrive")
  .description("Wrapper for gdrive CLI")
  .version(pkg.version);

async function ensureGdrive() {
  try {
    await execa("gdrive", ["version"]);
  } catch (err) {
    console.error(
      chalk.red(
        "`gdrive` CLI が見つかりません。https://github.com/prasmussen/gdrive を参照してインストールしてください。"
      )
    );
    process.exit(1);
  }
}

program
  .command("list [query]")
  .description("List files using gdrive")
  .option("-n, --max <n>", "max results", "20")
  .action(async (query: string | undefined, options: any) => {
    await ensureGdrive();
    const args: string[] = ["list"];
    if (options.max) args.push("--query", `trashed=false`); // gdrive list flags vary; user can adapt
    if (query) args.push(query);
    try {
      const { stdout } = await execa("gdrive", args);
      console.log(stdout);
    } catch (err: any) {
      console.error(chalk.red(err?.stderr ?? err?.message ?? String(err)));
      process.exit(1);
    }
  });

program
  .command("upload <path>")
  .description("Upload a file via gdrive")
  .option("-p, --parent <id>", "parent folder id")
  .action(async (path: string, options: any) => {
    await ensureGdrive();
    const args: string[] = ["upload", path];
    if (options.parent) args.push("--parent", options.parent);
    try {
      const { stdout } = await execa("gdrive", args);
      console.log(stdout);
    } catch (err: any) {
      console.error(chalk.red(err?.stderr ?? err?.message ?? String(err)));
      process.exit(1);
    }
  });

program
  .command("download <fileId> [out]")
  .description("Download a file via gdrive")
  .action(async (fileId: string, out: string | undefined) => {
    await ensureGdrive();
    const args: string[] = ["download", fileId];
    if (out) args.push(out);
    try {
      const { stdout } = await execa("gdrive", args);
      console.log(stdout);
    } catch (err: any) {
      console.error(chalk.red(err?.stderr ?? err?.message ?? String(err)));
      process.exit(1);
    }
  });

program
  .command("info <fileId>")
  .description("Show file info")
  .action(async (fileId: string) => {
    await ensureGdrive();
    try {
      const { stdout } = await execa("gdrive", ["info", fileId]);
      console.log(stdout);
    } catch (err: any) {
      console.error(chalk.red(err?.stderr ?? err?.message ?? String(err)));
      process.exit(1);
    }
  });

program.parse(process.argv);
