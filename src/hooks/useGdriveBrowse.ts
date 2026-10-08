import { useCallback, useEffect, useState } from "react";
import { getInfo, getItems } from "../services/gdrive/index.js";
import type { AppError, GdriveItem, Result } from "../types/index.js";
import { success } from "../utils/index.js";
import type { ListItem } from "./useFileOperations.js";

export type HistoryEntry = {
  id: string;
  name: string;
};

type FolderContent = {
  name: string;
  items: GdriveItem[];
};

const fetchFolderContent = async (
  folderId: string,
): Promise<Result<FolderContent>> => {
  if (folderId === "starred") {
    const resItem = await getItems("starred");
    if (!resItem.success) {
      return resItem;
    }
    return success({ name: "スター付き", items: resItem.data });
  }

  const [info, resItem] = await Promise.all([
    getInfo(folderId),
    getItems(folderId),
  ]);

  if (!info.success) {
    return info;
  }
  if (!resItem.success) {
    return resItem;
  }

  return success({ name: info.data.name, items: resItem.data });
};

export const useGdriveBrowse = (initialFolderId = "starred") => {
  const [currentId, setCurrentId] = useState<string>(initialFolderId);
  const [folderName, setFolderName] = useState<string>("Loading...");
  const [items, setItems] = useState<GdriveItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AppError | null>(null);

  const generateListItem = useCallback(
    (item: GdriveItem | undefined): ListItem[] => {
      if (!item) {
        return [];
      }
      const isFolder = item.type === "folder";
      return [
        {
          label: isFolder ? `📁 ${item.name}` : `📄 ${item.name}`,
          value: { id: item.id, original: item, isFolder: isFolder },
        },
      ];
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchFolderContent(currentId);
      if (!isMounted) {
        return;
      }

      if (result.success) {
        setFolderName(result.data.name);
        setItems(result.data.items);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [currentId]);

  const goToParent = useCallback(async () => {
    const newHistory = [...history];
    const parent = newHistory.pop();
    if (parent) {
      setHistory(newHistory);
      setCurrentId(parent.id);
      return;
    }

    if (currentId === "starred") {
      return;
    }

    const result = await getInfo(currentId);
    if (result.success && result.data.parents.length > 0) {
      setCurrentId(result.data.parents[0]);
    }
  }, [currentId, history]);

  const enterFolder = useCallback(
    (folderId: string) => {
      setHistory([...history, { id: currentId, name: folderName }]);
      setCurrentId(folderId);
    },
    [currentId, folderName, history],
  );

  return {
    currentId,
    folderName,
    items,
    history,
    loading,
    error,
    goToParent,
    enterFolder,
    generateListItem,
  };
};
