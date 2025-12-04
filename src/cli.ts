#!/usr/bin/env node

import { Command } from "commander";
import { execa } from "execa";
import chalk from "chalk";
import enquirer from "enquirer";
import { argv } from "process";

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

async function getInfo(id: string) {
  const parse = (stdout: string) => {
    const INFO_KNOWN_KEYS = [
      "id",
      "name",
      "mime",
      "mimeType",
      "created",
      "modified",
      "shared",
      "parents",
      "viewUrl",
      "webViewLink",
    ] as const;
    type INFO_KNOWN_KEYS_TYPE = (typeof INFO_KNOWN_KEYS)[number];
    type Info<T extends string = INFO_KNOWN_KEYS_TYPE> = {
      [K in T]: K extends "shared" ? boolean : string;
    };

    const info = {} as Info;

    stdout.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([^:]+):\s*(.*)$/);
      if (!m) return;
      const key = m[1].trim().toLowerCase();
      const val = m[2].trim();

      const isKnownKey = (key: string): key is INFO_KNOWN_KEYS_TYPE => {
        return (INFO_KNOWN_KEYS as readonly string[]).includes(key);
      };

      if (isKnownKey(key)) {
        if (key === "shared") {
          info[key] = /true/i.test(val);
          return;
        }

        info[key] = val;
      }
    });
    return info;
  };

  try {
    const { stdout } = await execa("gdrive", ["files", "info", id]);
    return parse(stdout);
  } catch (_err) {
    try {
      const { stdout } = await execa("gdrive", ["info", id]);
      return parse(stdout);
    } catch (err: any) {
      console.error(
        chalk.red("failed to get info:"),
        err?.stderr ?? err?.message ?? String(err)
      );
      throw new Error("failed to get info");
    }
  }
}

async function getItems(parentId: string) {
  try {
    const { stdout } = await execa("gdrive", [
      "files",
      "list",
      "--parent",
      parentId,
    ]);
    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const dataLines = lines.filter((ln) => !/^Id\b/.test(ln));
    const items = dataLines.map((line) => {
      const cols = line
        .split(/\s{2,}/)
        .map((c) => c.trim())
        .filter(Boolean);
      const id = cols[0] ?? "";
      const name = cols[1] ?? "";
      const type = cols[2] ?? "";
      const size = cols[3] ?? "";
      const created = cols[4] ?? "";
      return { id, name, type, size, created };
    });
    return items;
  } catch (err: any) {
    console.error(
      chalk.red("gdrive files list failed:"),
      err?.stderr ?? err?.message ?? String(err)
    );
    throw err;
  }
}

// --- browse TUI ---
program
  .command("browse [folderId]")
  .description("Browse Drive in a simple TUI and download files")
  .action(async (folderId) => {
    await ensureGdrive();

    let current: {
      id: string;
      name: string;
    } = await getInfo(folderId);
    const parents: { id: string; name: string }[] = [];

    while (true) {
      const items = await getItems(current.id);
      const choices = items.map((it) => ({
        name: `${it.type.padEnd(6).slice(0, 6)} ${it.name}${chalk.hidden(
          it.id
        )}`,
        value: it,
      }));
      const up = {
        name: ".. (up)",
        value: { id: "..", name: "..", type: "", size: "", created: "" },
      };
      const exit = {
        name: "Exit",
        value: { id: "EXIT", name: "Exit", type: "", size: "", created: "" },
      };

      const { Select, Confirm } = enquirer as any;
      const prompt = new Select({
        name: "browse",
        message: `Browsing: ${current.name} (${current.id})`,
        choices: [up, ...choices, exit],
        result(name: string) {
          const value = [up, ...choices, exit].find(
            (c) => c.name === name
          )?.value;
          return value;
        },
      });

      let choice;
      try {
        choice = await prompt.run();
      } catch (err: any) {
        console.log();
        return;
      }

      if (choice.id === "EXIT") {
        console.log("Exiting...");
        return;
      }

      // Up-navigation is disabled for now
      if (choice.id === "..") {
        const up = parents.pop();
        if (up) current = up;
        const parentInfo = await getInfo(current.id);
        if (parentInfo) current = await getInfo(parentInfo.parents);
        continue;
      }

      const id = choice.id;
      const name = choice.name;

      // Folder detection and navigation disabled for now
      const isFolder = choice.type ? /folder/i.test(choice.type) : false;
      if (isFolder) {
        current = { id, name };
        parents.push(current);
        continue;
      }

      // handle file
      const download = {
        name: "Download",
      };
      const info = {
        name: "Info",
      };
      const back = {
        name: "Back",
      };
      const prompt2 = new Select({
        name: "file-action",
        message: `Selected file: ${name} (${id})`,
        choices: [back, download, info],
      });
      try {
        const action = await prompt2.run();
        if (action === "Download") {
          const downloadPrompt = new Confirm({
            name: "confirm-download",
            message: `Download file: ${name} (${id})?`,
          });
          const confirmed = await downloadPrompt.run();
          if (confirmed) {
            try {
              console.log(chalk.green(`Downloading file: ${name} (${id})...`));
              await execa("gdrive", ["files", "download", id]);
              console.log(chalk.green(`Downloaded file: ${name} (${id})`));
            } catch (err: any) {
              console.error(
                chalk.red("Download failed:"),
                err?.stderr ?? err?.message ?? String(err)
              );
            }
          }
        }
        if (action === "Info") {
          const fileInfo = await getInfo(id);
          if (fileInfo) {
            console.log(chalk.blue("File Info:"));
            for (const [key, val] of Object.entries(fileInfo)) {
              console.log(`${chalk.yellow(key)}: ${val}`);
            }
          } else if (action.name === ".. (up)") {
            const up = parents.pop();
            if (up) current = up;
            const parentInfo = await getInfo(current.id);
            if (parentInfo && parentInfo.parents) current = parentInfo;
          } else {
            console.log(chalk.red("Failed to get file info."));
          }
        }
        if (action === "Back") {
          continue;
        }
      } catch (err: any) {
        console.error("error");
        return;
      }
    }
  });

// parse at the end after all commands registered
program.parse(process.argv);
