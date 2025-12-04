import chalk from "chalk";
import type { BrowseNode } from "../commands/browse.js";
import { getInfo, getItems } from "../services/gdrive/index.js";

import pkg from "enquirer";
const { Select } = pkg;

interface Break {
  handleLoop: "break";
}

interface Continue {
  handleLoop: "continue";
  current: BrowseNode;
  parents: BrowseNode[];
}

interface Pass {
  handleLoop: "pass";

  id: string;
  name: string;
}

type Return = Break | Continue | Pass;

export const handleFolder = async (
  current: BrowseNode,
  parents: BrowseNode[],
): Promise<Return> => {
  const result = await getItems(current.id);

  if (!result.success) {
    console.error(
      chalk.red(result.error.type),
      result.error.message ?? result.error.originalError,
    );
    return { handleLoop: "break" };
  }

  const items = result.data;

  const choices = items.map((it: any) => ({
    name: `${it.type.padEnd(6).slice(0, 6)} ${it.name}${chalk.hidden(it.id)}`,
    value: it,
  }));
  const up = {
    name: ".. (up)",
    value: { id: "..", name: "..", type: "" },
  };
  const exit = {
    name: "Exit",
    value: { id: "EXIT", name: "Exit", type: "" },
  };
  const prompt = new Select({
    name: "browse",
    message: `Browsing: ${current.name} (${current.id})`,
    choices: [up, ...choices, exit],
    result(name: string) {
      const value = [up, ...choices, exit].find((c) => c.name === name)?.value;
      if (!value) {
        throw new Error("Invalid selection");
      }
      return value;
    },
  });

  const { name, id, type } = await prompt.run();

  switch (id) {
    case "EXIT":
      console.info("Exiting...");
      return { handleLoop: "break" };
    case "..": {
      const [upNode, ...rest] = parents;

      if (upNode) {
        return {
          handleLoop: "continue",
          current: upNode,
          parents: rest,
        };
      }
      const result = await getInfo(current.id);
      if (!result.success) {
        console.error(
          chalk.red(result.error.type),
          result.error.message ?? result.error.originalError,
        );
        return { handleLoop: "break" };
      }
      const parentIds = result.data.parents;

      const result2 = await getInfo(parentIds[0]);

      if (!result2.success) {
        console.error(
          chalk.red(result2.error.type),
          result2.error.message ?? result2.error.originalError,
        );
        return { handleLoop: "break" };
      }

      const { id, name } = result2.data;

      return {
        handleLoop: "continue",
        current: { id, name },
        parents: rest,
      };
    }
    default: {
      if (type === "folder") {
        return {
          handleLoop: "continue",
          current: { id, name },
          parents: [current, ...parents],
        };
      }
      return { handleLoop: "pass", id, name };
    }
  }
};
