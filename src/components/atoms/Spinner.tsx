import React from "react";
import { Box, Text } from "ink";
import InkSpinner from "ink-spinner";

export const Spinner = (
  props: React.PropsWithChildren<{ color?: "green" | "yellow" }>,
) => (
  <Box>
    <Text color={props.color ?? "green"}>
      <InkSpinner type="dots" />
    </Text>
    <Text> </Text>
    <Text color="gray">{props.children ?? "Loading..."}</Text>
  </Box>
);
