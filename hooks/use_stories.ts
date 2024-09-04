import { useCallback, useEffect, useState } from "react";

export interface StoryDef {
  id: string;
  index?: boolean;
  entryPoint: string;
  name: string;
  group?: string;
  controls?: Record<string, unknown>;
}

export function useStories() {
  const [stories, setStories] = useState<StoryDef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fetchStories = useCallback(() => {
    fetch("/api/stories")
      .then((resp) => resp.json())
      .then(setStories)
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    fetchStories();
    addEventListener("story-update", fetchStories);
    return () => removeEventListener("story-update", fetchStories);
  }, []);
  return { stories, loaded };
}
