import { createReactElementLoader } from "../common.tsx";

export const meta = {
  name: "Anchor",
  group: "General",
};

const Story = () => {
  return (
    <a href="#">
      Anchor
    </a>
  );
};

export const load = createReactElementLoader(
  <Story />,
);
