import { Command } from "commander";
import { browse } from "./commands/browse.js";
const pkg = { version: "0.1.0" };
const program = new Command();
program
  .name("mygdrive")
  .description("Wrapper for gdrive CLI")
  .version(pkg.version);

program
  .command("browse [folderId]")
  .description("Browse Drive in a simple TUI and download files")
  .action(browse);

program.parse(process.argv);
