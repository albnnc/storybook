import { createReactElementLoader } from "../common.tsx";

export const meta = {
  name: "Button",
  group: "General",
};

const Story = () => {
  return (
    <button>
      Button
    </button>
  );
};

export const load = createReactElementLoader(
  <Story />,
);
