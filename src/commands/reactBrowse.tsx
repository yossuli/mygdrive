import { Box, Text, useApp, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import { useCallback, useEffect, useState } from "react";
import type { Failed, Info, Item } from "../types/index.js";
import { ensureGdrive } from "../utils/ensureGdrive.js";
import { downloadFile, getInfo } from "../utils/gdrive/index.js";
import { getItems } from "../utils/gdrive/index.js";

type ListItem = {
  label: string;
  value: { id: string; original: any; isFolder: boolean; isBack?: boolean };
};

// 履歴をツリー状に表示するコンポーネント
const HistoryTree = ({
  history,
  currentName,
  loading,
}: {
  history: { id: string; name: string }[];
  currentName: string;
  loading: boolean;
}) => {
  const nodes = [...history, { name: currentName, id: "current" }];
  const deepestIndex = nodes.length - 1;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {nodes.map((node, index) => {
        const isCurrent = index === nodes.length - 1;

        const indent = [...Array(index || 1).fill("  "), "└─ "]
          .slice(1, index + 1)
          .join("");

        if (loading && deepestIndex === index) {
          return (
            <Text key={node.id}>
              <Text color="gray">{indent}</Text>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Text> </Text>
              <Text color="gray"> Loading...</Text>
            </Text>
          );
        }
        return (
          <Box key={node.id}>
            <Text color="gray">{indent}</Text>
            <Text color={isCurrent ? "green" : "gray"} bold={isCurrent}>
              {isCurrent ? "📂 " : "📁 "}
              {node.name}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
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
  const [error, setError] = useState<Failed["error"] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<ListItem | null>(null);

  // --- State: アクションモーダル ---
  const [activeFile, setActiveFile] = useState<ListItem | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  // ★ 追加: 詳細情報表示用ステート
  const [detailedInfo, setDetailedInfo] = useState<Info | null>(null);

  const generateListItem = useCallback((item: Item | undefined) => {
    if (!item) {
      return [];
    }
    const isFolder = /folder/i.test(item.type);
    return [
      {
        label: isFolder ? `📁 ${item.name}` : `📄 ${item.name}`,
        value: { id: item.id, original: item, isFolder: isFolder },
      },
    ];
  }, []);

  const handleBack = async () => {
    const newHistory = [...history];
    const parent = newHistory.pop();
    if (parent) {
      setHistory(newHistory);
      setCurrentId(parent.id);
      return;
    }
    // ルートの場合はgetInfoで親を取得
    const result = await getInfo(currentId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const parentIds = result.data.parents;
    if (parentIds.length === 0) {
      return;
    }
    setCurrentId(parentIds[0]);
  };

  const handleItem = (item: ListItem) => {
    if (item.value.isBack) {
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

  // グローバルショートカット ('q')
  useInput((input, key) => {
    // 処理中や詳細表示中は誤操作防止のため終了しない
    if (processing || detailedInfo) {
      return;
    }
    if (input === "q") {
      exit();
    }
    if (key.leftArrow) {
      handleBack();
    }
    if (key.rightArrow && highlightedItem) {
      handleItem(highlightedItem);
    }
  });

  // --- Data Fetching ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      await ensureGdrive();
      setLoading(true);
      setError(null);
      setStatusMessage(null);

      // フォルダ移動時は選択状態をリセット
      setActiveFile(null);
      setDetailedInfo(null);

      // 並列で取得して高速化
      const [info, resItem] = await Promise.all([
        getInfo(currentId),
        getItems(currentId),
      ]);
      if (!info.success) {
        setError(info.error);
        setLoading(false);
        return;
      }

      if (!resItem.success) {
        setError(resItem.error);
        setLoading(false);
        return;
      }

      if (isMounted) {
        setFolderName(info.data.name);
        setItems(resItem.data);
        setHighlightedItem(generateListItem(resItem.data?.[0])[0]);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [currentId, generateListItem]);

  // --- Actions ---

  const handleItemSelect = (item: ListItem) => {
    if (item.value.isBack) {
      handleBack();
      return;
    }

    handleItem(item);
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
        setError(result.error);
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
        setError(result.error);
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

  const fileListItems: ListItem[] = [
    {
      label: ".. (up)",
      value: { id: "BACK", original: null, isFolder: true, isBack: true },
    },
    ...items.flatMap(generateListItem),
  ];

  const actionItems = [
    { label: "🔙 Back", value: "back" },
    { label: "⬇️  Download", value: "download" },
    { label: "ℹ️  Info", value: "info" },
  ];

  // 詳細情報の行コンポーネント
  const InfoRow = ({
    label,
    value,
  }: { label: string; value: string | boolean | string[] }) => {
    const toPascalCase = (str: string) => {
      const [first, ...rest] = str.split("");
      return `${first.toUpperCase() + rest.join("")}`;
    };

    const v =
      typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : Array.isArray(value)
          ? value.join(", ")
          : toPascalCase(value);
    return (
      <Box>
        <Box width={15}>
          <Text color="cyan">{label}:</Text>
        </Box>
        <Box flexGrow={1}>
          <Text>{v}</Text>
        </Box>
      </Box>
    );
  };

  // --- View ---

  if (error) {
    return (
      <Box padding={1} borderStyle="round" borderColor="red">
        <Text color="red">Error: {error.type}</Text>
        {error.message && <Text>{error.message}</Text>}
        {error.err && <Text>{error.err}</Text>}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="round"
        borderColor="cyan"
        padding={1}
        marginBottom={1}
        flexDirection="column"
      >
        <HistoryTree
          history={history}
          currentName={folderName}
          loading={loading}
        />

        <Box flexDirection="column">
          <Text>
            Browsing:
            <Text> </Text>
            {loading ? (
              <Text>
                <Text color="green">
                  <Spinner type="dots" />
                </Text>
                Loading...
              </Text>
            ) : (
              <>
                <Text color="green" bold>
                  {folderName}
                </Text>
                <Text> </Text>
                <Text color="gray">({currentId})</Text>
              </>
            )}
          </Text>
        </Box>
      </Box>

      {/* Main Area */}
      <Box flexDirection="column" minHeight={10}>
        {loading ? (
          <Box borderStyle="single" borderColor="yellow">
            <Text>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Text> </Text>
              Loading...
            </Text>
          </Box>
        ) : processing ? (
          <Box borderStyle="double" borderColor="yellow" padding={1}>
            <Text>
              <Text color="yellow">
                <Spinner type="dots" />
              </Text>
              <Text> </Text>
              Processing {activeFile?.value.original.name}...
            </Text>
          </Box>
        ) : detailedInfo ? (
          // ★ 追加: 詳細情報表示ビュー
          <Box
            borderStyle="double"
            borderColor="blue"
            flexDirection="column"
            padding={1}
          >
            <Box marginBottom={1}>
              <Text bold underline>
                File Details
              </Text>
            </Box>
            {Object.entries(detailedInfo).map(([key, val]) => (
              <InfoRow key={key} label={key} value={val} />
            ))}

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
            flexDirection="column"
            padding={1}
          >
            <Text bold underline>
              Selected: {activeFile.value.original.name}
            </Text>
            <Text color="gray">ID: {activeFile.value.id}</Text>
            <SelectInput items={actionItems} onSelect={handleActionSelect} />
          </Box>
        ) : (
          // ファイルリスト
          <Box padding={1} borderStyle="single" borderColor="green">
            <SelectInput
              items={fileListItems.map((item) => ({
                ...item,
                key: item.value.id,
              }))}
              onSelect={handleItemSelect}
              onHighlight={setHighlightedItem}
              limit={10}
            />
          </Box>
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
