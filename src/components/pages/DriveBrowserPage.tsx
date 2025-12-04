import { Box, Text, useApp, useInput } from "ink";
import { useState } from "react";
import { useDriveBrowser } from "../../hooks/useDriveBrowser.js";
import {
  type ListItem,
  useFileOperations,
} from "../../hooks/useFileOperations.js";
import { Spinner } from "../atoms/Spinner.js";
import { StyledText } from "../atoms/StyledText.js";
import { StatusMessage } from "../molecules/StatusMessage.js";
import { ActionMenu } from "../organisms/ActionMenu.js";
import { DetailPanel } from "../organisms/DetailPanel.js";
import { FileList } from "../organisms/FileList.js";
import { HistoryTree } from "../organisms/HistoryTree.js";
import { AppLayout } from "../templates/AppLayout.js";

export const DriveBrowserPage = ({
  initialFolderId,
}: { initialFolderId?: string }) => {
  const { exit } = useApp();
  const [highlightedItem, setHighlightedItem] = useState<ListItem | null>(null);

  const browser = useDriveBrowser(initialFolderId);
  const operations = useFileOperations();

  // --- Input Handling ---
  const handleItemSelect = (item: ListItem) => {
    setHighlightedItem(null);
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

  useInput((input, key) => {
    if (operations.processing || operations.detailedInfo) {
      return;
    }
    if (input === "q") {
      exit();
    }
    if (key.leftArrow) {
      browser.goToParent();
    }
    if (key.rightArrow && highlightedItem) {
      if (highlightedItem.value.isBack) {
        return;
      }
      handleItemSelect(highlightedItem);
    }
  });

  // --- Data for Rendering ---

  const fileListItems: ListItem[] = [
    {
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
    },
    ...browser.items.flatMap(browser.generateListItem),
  ];

  // --- Rendering ---

  const error = browser.error || operations.error;
  if (error) {
    return (
      <Box padding={1} borderStyle="round" borderColor="red">
        <Text color="red">Error: {error.type}</Text>
        {error.message && <Text>{error.message}</Text>}
      </Box>
    );
  }

  // Header
  const header = (
    <Box
      borderStyle="round"
      borderColor="cyan"
      padding={1}
      marginBottom={1}
      flexDirection="column"
    >
      <HistoryTree
        history={browser.history}
        currentName={browser.folderName}
        loading={browser.loading}
      />
      <Box flexDirection="column">
        <Box>
          <Text>Browsing: </Text>
          {browser.loading ? (
            <Spinner color="green">Loading...</Spinner>
          ) : (
            <>
              <StyledText variant="success" bold>
                {browser.folderName}
              </StyledText>
              <Text> </Text>
              <StyledText variant="secondary">({browser.currentId})</StyledText>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );

  // Main
  let mainContent: React.ReactNode;
  if (browser.loading) {
    mainContent = (
      <Box borderStyle="single" borderColor="yellow">
        <Spinner color="green">Loading...</Spinner>
      </Box>
    );
  } else if (operations.processing) {
    mainContent = (
      <Box borderStyle="double" borderColor="yellow" padding={1}>
        <Spinner color="yellow">
          Processing {operations.activeFile?.value.original.name}...
        </Spinner>
      </Box>
    );
  } else if (operations.detailedInfo) {
    mainContent = (
      <DetailPanel
        info={operations.detailedInfo}
        onBack={operations.hideFileInfo}
      />
    );
  } else if (operations.activeFile) {
    mainContent = (
      <ActionMenu
        activeFile={operations.activeFile}
        onSelect={handleActionSelect}
      />
    );
  } else {
    mainContent = (
      <FileList
        items={fileListItems}
        onSelect={handleItemSelect}
        onHighlight={setHighlightedItem}
      />
    );
  }

  // Footer
  const footer = (
    <>
      <StatusMessage
        message={operations.statusMessage ?? undefined}
        type="success"
      />
      <Box marginTop={operations.statusMessage ? 1 : 0}>
        <StyledText variant="secondary">
          {operations.detailedInfo
            ? "Press Enter to go back"
            : operations.activeFile
              ? "Select an action"
              : "Use ↑/↓ to move, Enter to select, 'q' to exit"}
        </StyledText>
      </Box>
    </>
  );

  return <AppLayout header={header} main={mainContent} footer={footer} />;
};

export default DriveBrowserPage;
