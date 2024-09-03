import { ReactElement } from "react";
import { createRoot } from "react-dom/client";

export function createReactElementLoader(
  children: ReactElement,
) {
  return () => {
    const container = document.getElementById("root");
    const root = createRoot(container!);
    root.render(children);
  };
}

// export function getStoryControls(): unknown {
//   try {
//     const searchParams = new URLSearchParams(globalThis.parent.location.search);
//     return JSON.parse(searchParams.get("controls") || "");
//   } catch {
//     return {};
//   }
// }

// // deno-lint-ignore no-explicit-any
// export function useStoryControls<T extends Record<string, any>>() {
//   const [storyInput, setStoryInput] = useState(getStoryControls);
//   useEffect(() => {
//     const listen = () => setStoryInput(getStoryControls);
//     globalThis.parent.addEventListener("controls-update", listen);
//     return () =>
//       globalThis.parent.removeEventListener("controls-update", listen);
//   }, []);
//   return storyInput as Partial<T>;
// }
