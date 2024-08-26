import { Plugin, type PluginApplyOptions } from "@albnnc/nvil";

export class StoryLrDomainPlugin extends Plugin {
  constructor() {
    super("STORY_LR_DOMAIN");
  }

  apply(this: StoryLrDomainPlugin, options: PluginApplyOptions) {
    super.apply(options);
    if (!this.project.dev) {
      return;
    }
    // const handleChange = async.debounce(async (change: string) => {
    //   const entry = this.project.bundle.get(change);
    //   if (!entry || entry.scope !== undefined) {
    //     return;
    //   }
    //   const storyBaseUrl = new URL(
    //     "./",
    //     new URL(change, this.project.targetUrl),
    //   );
    //   const storyMetaUrl = new URL("./meta.json", storyBaseUrl);
    //   console.log("storyMetaUrl", storyMetaUrl);
    //   const id = await fetch(storyMetaUrl)
    //     .then((v) => v.json())
    //     .then((v) => v.id)
    //     .catch(() => undefined);
    //   if (!id) {
    //     return;
    //   }
    //   this.logger.info(`Reloading`);
    //   await fetch(new URL(`http://localhost:${this.port}`), {
    //     method: "POST",
    //     body: id,
    //   })
    //     .then(async (v) => {
    //       await v.body?.cancel();
    //       if (!v.ok) {
    //         this.logger.warn("Unable to request reload");
    //       }
    //     })
    //     .catch(() => undefined);
    // }, 200);
    this.project.stager.on("WRITE_END", (changes) => {
      for (const change of changes as string[]) {
        console.log("!", change);
        // handleChange(change);
      }
    });
  }
}
