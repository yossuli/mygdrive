import { Box, Text, useApp, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import type { Info } from "../types/index.js";
import { ensureGdrive } from "../utils/ensureGdrive.js";
import { downloadFile, getInfo } from "../utils/gdrive/index.js";
import { getItems } from "../utils/gdrive/index.js";

type ListItem = {
  label: string;
  value: { id: string; original: any; isFolder: boolean; isBack?: boolean };
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
const App = ({ initialFolderId }: { initialFolderId?: string }) => {
  const { exit } = useApp();

  // --- State: ナビゲーション ---
  const [currentId, setCurrentId] = useState<string>(initialFolderId || "root");
  const [folderName, setFolderName] = useState<string>("Loading...");
  const [items, setItems] = useState<any[]>([]);
  const [history, setHistory] = useState<{ id: string; name: string }[]>([]);

  // --- State: UI制御 ---
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // --- State: アクションモーダル ---
  const [activeFile, setActiveFile] = useState<ListItem | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  // ★ 追加: 詳細情報表示用ステート
  const [detailedInfo, setDetailedInfo] = useState<Info | null>(null);

  // グローバルショートカット ('q')
  useInput((input) => {
    // 処理中や詳細表示中は誤操作防止のため終了しない
    if (!(processing || detailedInfo) && input === "q") {
      exit();
    }
  });

  // --- Data Fetching ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setStatusMessage(null);

      // フォルダ移動時は選択状態をリセット
      setActiveFile(null);
      setDetailedInfo(null);

      await ensureGdrive();
      // 並列で取得して高速化
      const [info, resItem] = await Promise.all([
        getInfo(currentId),
        getItems(currentId),
      ]);
      if (!info.success) {
        setError(info.error.message || "Failed to fetch folder info");
        setLoading(false);
        return;
      }

      if (!resItem.success) {
        setError(resItem.error.message || "Failed to fetch items");
        setLoading(false);
        return;
      }

      if (isMounted) {
        setFolderName(info.data.name);
        setItems(resItem.data);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [currentId]);

  // --- Actions ---

  const handleItemSelect = (item: ListItem) => {
    if (item.value.isBack) {
      const newHistory = [...history];
      const parent = newHistory.pop();
      if (parent) {
        setHistory(newHistory);
        setCurrentId(parent.id);
      }
      return;
    }

    if (item.value.isFolder) {
      setHistory([...history, { id: currentId, name: folderName }]);
      setCurrentId(item.value.id);
    } else {
      setActiveFile(item);
      setStatusMessage(null);
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  const handleActionSelect = async (action: { value: string }) => {
    if (!activeFile) {
      return;
    }

    if (action.value === "back") {
      setActiveFile(null); // リストに戻る
      return;
    }

    if (action.value === "download") {
      setProcessing(true);
      const result = await downloadFile(activeFile.value.id);
      if (!result.success) {
        setError(`Download failed: ${result.error.message || "Unknown error"}`);
        setProcessing(false);
        return;
      }
      setStatusMessage(
        `Successfully downloaded: ${activeFile.value.original.name}`,
      );
      setActiveFile(null);
      setProcessing(false);
    }

    if (action.value === "info") {
      // ★ 修正: getInfoで詳細を取得してから表示
      setProcessing(true);
      const result = await getInfo(activeFile.value.id);
      if (!result.success) {
        setProcessing(false);
        setError(
          `Failed to get info: ${result.error.message || "Unknown error"}`,
        );
        return;
      }
      const fullInfo = result.data;
      setDetailedInfo(fullInfo);
      setProcessing(false);
    }
  };

  // 詳細画面からの「戻る」ハンドラ
  const handleInfoBack = () => {
    setDetailedInfo(null); // 詳細表示を閉じてアクションメニューに戻る
  };

  // --- Rendering Helpers ---

  const fileListItems: ListItem[] = [];
  if (history.length > 0) {
    fileListItems.push({
      label: ".. (up)",
      value: { id: "BACK", original: null, isFolder: true, isBack: true },
    });
  }
  items.forEach((it) => {
    const isFolder = /folder/i.test(it.type);
    const icon = isFolder ? "📁" : "📄";
    fileListItems.push({
      label: `${icon} ${it.name}`,
      value: { id: it.id, original: it, isFolder: isFolder },
    });
  });

  const actionItems = [
    { label: "⬇️  Download", value: "download" },
    { label: "ℹ️  Info", value: "info" },
    { label: "🔙 Back", value: "back" },
  ];

  // 詳細情報の行コンポーネント
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Box>
      <Box width={15}>
        <Text color="cyan">{label}:</Text>
      </Box>
      <Box flexGrow={1}>
        <Text>{value}</Text>
      </Box>
    </Box>
  );

  // --- View ---

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
        {history.map((h, idx) => (
          <Text key={h.id}>
            {h.name}
            {idx < history.length - 1 && <Text color="gray"> / </Text>}
          </Text>
        ))}
        {history.length > 0 && <Text color="gray"> / </Text>}
        <Text>
          Browsing:
          <Text color="green" bold>
            {folderName}
          </Text>
          <Text color="gray">({currentId})</Text>
        </Text>
      </Box>

      {/* Main Area */}
      <Box flexDirection="column" minHeight={10}>
        {loading ? (
          <Text>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            Loading...
          </Text>
        ) : processing ? (
          <Box borderStyle="double" borderColor="yellow" padding={1}>
            <Text>
              <Text color="yellow">
                <Spinner type="arc" />
              </Text>
              Processing {activeFile?.value.original.name}...
            </Text>
          </Box>
        ) : detailedInfo ? (
          // ★ 追加: 詳細情報表示ビュー
          <Box
            borderStyle="double"
            borderColor="blue"
            padding={1}
            flexDirection="column"
          >
            <Text bold underline>
              File Details
            </Text>

            <InfoRow label="Name" value={detailedInfo.name} />
            <InfoRow label="ID" value={detailedInfo.id} />
            <InfoRow label="Type" value={detailedInfo.mime} />
            <InfoRow label="Size" value={detailedInfo.size || "-"} />
            <InfoRow label="Created" value={detailedInfo.created} />
            <InfoRow label="Modified" value={detailedInfo.modified} />
            <InfoRow
              label="Shared"
              value={detailedInfo.shared ? "Yes" : "No"}
            />

            <Box marginTop={1}>
              <SelectInput
                items={[{ label: "🔙 Back", value: "back" }]}
                onSelect={handleInfoBack}
              />
            </Box>
          </Box>
        ) : activeFile ? (
          // アクションモード
          <Box
            borderStyle="double"
            borderColor="green"
            padding={1}
            flexDirection="column"
          >
            <Text bold underline>
              Selected: {activeFile.value.original.name}
            </Text>
            <Text color="gray">ID: {activeFile.value.id}</Text>
            <SelectInput items={actionItems} onSelect={handleActionSelect} />
          </Box>
        ) : (
          // ファイルリスト
          <SelectInput
            items={fileListItems.map((item) => ({
              ...item,
              key: item.value.id,
            }))}
            onSelect={handleItemSelect}
            limit={10}
          />
        )}
      </Box>

      {/* Footer */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderTop={true}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor="gray"
        flexDirection="column"
      >
        {statusMessage && (
          <Text color="green" bold>
            {statusMessage}
          </Text>
        )}
        <Text color="gray">
          {detailedInfo
            ? "Press Enter to go back"
            : activeFile
              ? "Select an action"
              : "Use ↑/↓ to move, Enter to select, 'q' to exit"}
        </Text>
      </Box>
    </Box>
  );
};

export default App;
