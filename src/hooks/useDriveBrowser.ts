import { useCallback, useEffect, useState } from "react";
import { getInfo, getItems } from "../services/gdrive/index.js";
import type { AppError, GdriveItem } from "../types/index.js";

export type HistoryEntry = {
  id: string;
  name: string;
};

export const useDriveBrowser = (initialFolderId = "root") => {
  const [currentId, setCurrentId] = useState<string>(initialFolderId);
  const [folderName, setFolderName] = useState<string>("Loading...");
  const [items, setItems] = useState<GdriveItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<AppError | null>(null);

  const generateListItem = useCallback((item: GdriveItem | undefined) => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [info, resItem] = await Promise.all([
          getInfo(currentId),
          getItems(currentId),
        ]);

        if (!isMounted) {
          return;
        }

        if (!info.success) {
          setError(info.error);
          return;
        }
        if (!resItem.success) {
          setError(resItem.error);
          return;
        }

        setFolderName(info.data.name);
        setItems(resItem.data);
      } catch (e: any) {
        setError({ type: "UNKNOWN_ERROR", message: e.message });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
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
