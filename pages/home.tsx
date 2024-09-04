import { Loader } from "../components/loader.tsx";
import { StoryIframe } from "../components/story_iframe.tsx";
import { useStories } from "../hooks/use_stories.ts";

export const HomePage = () => {
  const { stories, loaded } = useStories();

  if (!loaded) {
    return <Loader css={{ margin: "auto", width: "24px", height: "24px" }} />;
  }

  const story = stories.find((story) => story.index === true);

  if (!story) {
    return <span css={{ margin: "24px" }}>Story not found</span>;
  }
  return (
    <div css={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
      <StoryIframe id={story.id} />
    </div>
  );
};
