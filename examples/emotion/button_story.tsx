import { createReactElementLoader } from "./common.tsx";

export const meta = {
  name: "Accordion",
  group: "Base",
};

const Story = () => {
  return <button>Button</button>;
};

export const load = createReactElementLoader(
  <Story />,
);
