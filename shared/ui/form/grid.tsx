import { Box, type BoxProps } from "../box.tsx";

export const FormGrid = (props: BoxProps) => {
  return (
    <Box
      css={{ display: "flex", flexDirection: "column", gap: "14px" }}
      {...props}
    />
  );
};
