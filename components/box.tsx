import { forwardRef, type HTMLAttributes } from "react";

export type BoxProps = HTMLAttributes<HTMLDivElement>;

export const Box = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  return <div ref={ref} css={{ minWidth: 0 }} {...props} />;
});
