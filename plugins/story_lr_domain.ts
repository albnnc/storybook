import { Plugin, type PluginApplyOptions } from "@albnnc/nvil";

export interface StoryLrDomainPluginOptions {
  onUpdate?: () => void;
}

export class StoryLrDomainPlugin extends Plugin {
  onUpdate?: () => void;

  constructor(options: StoryLrDomainPluginOptions) {
    super("STORY_LR_DOMAIN");
    this.onUpdate = options.onUpdate;
  }

  apply(this: StoryLrDomainPlugin, options: PluginApplyOptions) {
    super.apply(options);
    if (!this.project.dev) {
      return;
    }
    this.project.stager.on("WRITE_END", (changes) => {
      for (const _ of changes as string[]) {
        this.onUpdate?.();
      }
    });
  }
}
