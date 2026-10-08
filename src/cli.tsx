#!/usr/bin/env node
import { Command } from "commander";
import { render } from "ink";
import App from "./components/pages/DriveBrowserPage.js";

const pkg = { version: "0.1.0" };
const program = new Command();
program
  .name("mygdrive")
  .description("Wrapper for gdrive CLI")
  .version(pkg.version);

program
  .command("browse [folderId]")
  .description("Browse Drive in a TUI and download files")
  .option("-s, --starred", "Start browsing from starred files")
  .action(
    async (folderId: string | undefined, options: { starred?: boolean }) => {
      const targetFolderId = options.starred ? "starred" : folderId;
      render(<App initialFolderId={targetFolderId} />);
    },
  );

program.parse(process.argv);
