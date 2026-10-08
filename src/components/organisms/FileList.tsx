import { Box, useInput } from "ink";
import SelectInput from "ink-select-input";
import { useState } from "react";
import type { ListItem } from "../../hooks/useFileOperations.js";
import type { IconType } from "../atoms/Icon.js";
import { FileRow } from "../molecules/FileRow.js";

type FileListProps = {
  items: ListItem[];
  onSelect: (item: ListItem) => void;
  onBack: () => void;
};

const ItemComponent = ({ value, isSelected }: any) => {
  const iconType: IconType = value.isBack
    ? "back"
    : value.isFolder
      ? "folder"
      : "file";
  // Handle case where original might be incomplete for 'back' item
  const item = value.isBack
    ? {
        ...value.original,
        name: ".. (up)",
        type: "folder" as const,
        size: "",
        created: "",
      }
    : value.original;

  return <FileRow item={item} isSelected={!!isSelected} iconType={iconType} />;
};

const backItem: ListItem = {
  label: ".. (up)",
  value: {
    id: "BACK",
    original: {
      id: "BACK",
      name: ".. (up)",
      type: "folder",
      size: "",
      created: "",
    },
    isFolder: true,
    isBack: true,
  },
};

export const FileList = ({ items, onSelect, onBack }: FileListProps) => {
  const displayItems = [backItem, ...items];
  const [highlightedItem, setHighlightedItem] = useState<ListItem | null>(
    displayItems[0] ?? null,
  );

  useInput((_input, key) => {
    if (highlightedItem === null) {
      return;
    }
    if (key.rightArrow && !highlightedItem.value.isBack) {
      onSelect(highlightedItem);
    }
    if (key.leftArrow) {
      onBack();
    }
  });

  return (
    <Box padding={1} borderStyle="single" borderColor="green">
      <SelectInput
        items={displayItems.map((item) => ({
          ...item,
          key: item.value.id,
        }))}
        onSelect={onSelect}
        onHighlight={setHighlightedItem}
        itemComponent={ItemComponent}
        limit={10}
      />
    </Box>
  );
};
