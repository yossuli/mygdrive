import chalk from "chalk";
// @ts-ignore
import { Select } from "enquirer";
import type { BrowseNode } from "../commands/browse";
import { getInfo } from "./getInfo";
import { getItems } from "./getItems";

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
  const items = await getItems(current.id);
  const choices = items.map((it) => ({
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
        return { handleLoop: "continue", current: upNode, parents: rest };
      }
      const { parents: parentIds } = await getInfo(current.id);

      const { id, name } = await getInfo(parentIds[0]);

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
