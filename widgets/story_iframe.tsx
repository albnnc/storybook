import { useEffect, useRef } from "react";
import { get } from "../utils/get.ts";

export const StoryIframe = ({ id }: { id: string }) => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const listen = (event: Event) => {
      if (get(event, "detail") === id) {
        ref.current?.contentWindow?.location.reload();
      }
    };
    addEventListener("story-update", listen);
    return () => removeEventListener("story-update", listen);
  }, [id]);

  return (
    <iframe
      key={id}
      ref={ref}
      src={`/stories/${id}`}
      css={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
      }}
    />
  );
};
