import {
  BuildPlugin,
  HtmlTemplatePlugin,
  Plugin,
  type PluginApplyOptions,
  Project,
  RunPlugin,
} from "@albnnc/nvil";
import * as path from "@std/path";
import { StoryLiveReloadPlugin } from "./plugins/story_live_reload.ts";
import { StoryMetaPlugin } from "./plugins/story_meta.ts";
import type { ScopeLogger } from "./utils/scope_logger.ts";
import { StoryMeta } from "./utils/story_meta.ts";
import { StorySetWatcher } from "./utils/story_set_watcher.ts";

export interface StorybookPluginOptions {
  globUrl: string;
  appTitle?: string;
  getPlugins?: (entryPoint: string) => Plugin[];
  constants?: StorybookPluginOptionsConstants;
}

export interface StorybookPluginOptionsConstants {
  groupOrder?: string[];
  appTitle?: string;
}

export class StorybookPlugin extends Plugin {
  globUrl: string;
  constants?: StorybookPluginOptions["constants"];
  getPlugins?: (entryPoint: string) => Plugin[];

  private storySetWatcher?: StorySetWatcher;
  private storyProjects = new Map<string, Project>();
  private uiProject?: Project;

  constructor(options: StorybookPluginOptions) {
    super("STORYBOOK");

    this.globUrl = options.globUrl;
    this.constants = options.constants;
    this.getPlugins = options.getPlugins;
  }

  apply(this: StorybookPlugin, options: PluginApplyOptions) {
    super.apply(options);
    this.project.stager.on("BOOTSTRAP", async () => {
      this.storySetWatcher = new StorySetWatcher({
        sourceUrl: this.project.sourceUrl,
        globUrl: this.globUrl,
      });
      await this.storySetWatcher.walk();
      await Promise.all(
        Array.from(this.storySetWatcher.data.values()).map((v) =>
          this.onStoryFind(v)
        ),
      );
      if (this.project.dev) {
        this.storySetWatcher?.watch();
        (async () => {
          for await (const event of this.storySetWatcher ?? []) {
            if (event.type === "FIND") {
              this.onStoryFind(event.entryPoint);
            }
            if (event.type === "LOSS") {
              this.onStoryLoss(event.entryPoint);
            }
          }
        })();
      }
      this.uiProject = new Project({
        plugins: [
          new BuildPlugin({
            entryPoint: "./ui/index.tsx",
            overrideEsbuildOptions: (options) => {
              options.define = {
                ...options.define,
                STORYBOOK_CONSTANTS: this.constants
                  ? JSON.stringify(this.constants)
                  : "undefined",
              };
            },
          }),
          new HtmlTemplatePlugin({ entryPoint: "./ui/index.html" }),
          new BuildPlugin({ entryPoint: "./ui/server.ts", scope: "SERVER" }),
          new RunPlugin({ scope: "SERVER", args: ["-A"] }),
        ],
        sourceUrl: import.meta.resolve("./"),
        targetUrl: this.project.targetUrl,
        dev: this.project.dev,
      });
      this.nestProjectLoggers(this.uiProject, ["UI"]);
      await this.uiProject.bootstrap();
    });
  }

  async [Symbol.asyncDispose]() {
    await this.uiProject?.[Symbol.asyncDispose]();
    for (const project of this.storyProjects.values()) {
      await project[Symbol.asyncDispose]();
    }
  }

  private async onStoryFind(this: StorybookPlugin, entryPoint: string) {
    const storyMeta = StoryMeta.fromEntryPoint(
      entryPoint,
      this.project.sourceUrl,
    );
    this.logger.info(`Found story ${storyMeta.entryPoint}`);
    const storyTargetUrl = this.getStoryTargetUrl(storyMeta);
    console.log("storyTargetUrl", storyTargetUrl);
    const storyProject = new Project({
      plugins: [
        ...(this.getPlugins?.(entryPoint) ?? []),
        new StoryMetaPlugin({ entryPoint }),
        new StoryLiveReloadPlugin(),
      ],
      sourceUrl: this.project.sourceUrl,
      targetUrl: storyTargetUrl,
      dev: this.project.dev,
    });
    this.nestProjectLoggers(storyProject, [storyMeta.id]);
    this.storyProjects.set(entryPoint, storyProject);
    await storyProject.bootstrap();
  }

  private async onStoryLoss(this: StorybookPlugin, entryPoint: string) {
    const storyMeta = StoryMeta.fromEntryPoint(
      entryPoint,
      this.project.sourceUrl,
    );
    this.logger.info(`Lost story ${storyMeta.entryPoint}`);
    const storyProject = this.storyProjects.get(entryPoint);
    if (!storyProject) {
      return;
    }
    await storyProject[Symbol.asyncDispose]();
    const storyTargetUrl = this.getStoryTargetUrl(storyMeta);
    this.storyProjects.delete(entryPoint);
    await Deno.remove(path.fromFileUrl(storyTargetUrl), { recursive: true });
  }

  private getStoryTargetUrl(this: StorybookPlugin, storyMeta: StoryMeta) {
    return new URL(
      `./stories/${storyMeta.id}/`,
      this.project.targetUrl,
    ).toString();
  }

  private nestScopeLogger(scopeLogger: ScopeLogger, segments: string[] = []) {
    scopeLogger.scope = [
      this.logger.scope,
      ...segments,
      scopeLogger.scope,
    ].join(" > ");
  }

  private nestProjectLoggers(project: Project, segments: string[] = []) {
    this.nestScopeLogger(project.logger, segments);
    project.plugins.forEach((v) => {
      this.nestScopeLogger(v.logger, segments);
    });
  }
}
