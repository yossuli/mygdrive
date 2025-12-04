import React from "react";
import { Box, Text } from "ink";

type AppLayoutProps = {
  header: React.ReactNode;
  main: React.ReactNode;
  footer: React.ReactNode;
};

export const AppLayout = ({ header, main, footer }: AppLayoutProps) => {
  return (
    <Box flexDirection="column">
      {header}
      <Box flexDirection="column" minHeight={10}>
        {main}
      </Box>
      <Box
        marginTop={1}
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor="gray"
        flexDirection="column"
      >
        {footer}
      </Box>
    </Box>
  );
};
