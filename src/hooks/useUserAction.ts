import { useInput } from "ink";
import type { ListItem, useFileOperations } from "./useFileOperations.js";
import type { useGdriveBrowse } from "./useGdriveBrowse.js";

interface UseUserActionProps {
  browser: ReturnType<typeof useGdriveBrowse>;
  operations: ReturnType<typeof useFileOperations>;
  exit: () => void;
}

export const useUserAction = ({
  browser,
  operations,
  exit,
}: UseUserActionProps) => {
  const handleItemSelect = (item: ListItem | null) => {
    if (!item) {
      return;
    }
    if (item.value.isBack) {
      browser.goToParent();
      return;
    }

    if (item.value.isFolder) {
      browser.enterFolder(item.value.id);
    } else {
      operations.selectFile(item);
    }
  };

  const handleActionSelect = async (action: { value: string }) => {
    if (action.value === "back") {
      operations.clearFileSelection();
      return;
    }
    if (action.value === "download") {
      await operations.downloadActiveFile();
    }
    if (action.value === "info") {
      await operations.fetchAndShowFileInfo();
    }
  };

  const handleListBack = () => {
    operations.clearFileSelection();
    const isGoToParent = !operations.activeFile;
    if (isGoToParent) {
      browser.goToParent();
    }
  };

  useInput((input, _key) => {
    if (operations.isBusy) {
      return;
    }
    if (input === "q") {
      exit();
    }
  });

  return {
    handleItemSelect,
    handleActionSelect,
    handleListBack,
  };
};
