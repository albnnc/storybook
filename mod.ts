import {
  BuildPlugin,
  CleanPlugin,
  HtmlTemplatePlugin,
  Plugin,
  type PluginApplyOptions,
  Project,
  RunPlugin,
} from "@albnnc/nvil";
import * as path from "@std/path";
import { StoryLrDomainPlugin } from "./plugins/story_lr_domain.ts";
import { StoryLrHostPlugin } from "./plugins/story_lr_host.ts";
import { StoryMetaPlugin } from "./plugins/story_meta.ts";
import { StoryMeta } from "./utils/story_meta.ts";
import { StorySetWatcher } from "./utils/story_set_watcher.ts";

export interface StorybookPluginOptions {
  globUrl: string;
  appTitle?: string;
  constants?: StorybookPluginOptionsConstants;
  getPlugins?: (entryPoint: string) => Plugin[];
}

export interface StorybookPluginOptionsConstants {
  groupOrder?: string[];
  appTitle?: string;
}

export class StorybookPlugin extends Plugin {
  globUrl: string;
  constants?: StorybookPluginOptions["constants"];
  getPlugins?: (entryPoint: string) => Plugin[];

  #storySetWatcher?: StorySetWatcher;
  #storyLrHostPlugin = new StoryLrHostPlugin();
  #hostProject?: Project;
  #domainProjects = new Map<string, Project>();

  constructor(options: StorybookPluginOptions) {
    super("STORYBOOK");

    this.globUrl = options.globUrl;
    this.constants = options.constants;
    this.getPlugins = options.getPlugins;
  }

  apply(options: PluginApplyOptions) {
    super.apply(options);
    this.project.stager.on("BOOTSTRAP", async () => {
      this.#storySetWatcher = new StorySetWatcher({
        sourceUrl: this.project.sourceUrl,
        globUrl: this.globUrl,
      });
      await this.#storySetWatcher.walk();
      await Promise.all(
        Array.from(this.#storySetWatcher.data.values()).map((v) =>
          this.#onStoryFind(v)
        ),
      );
      if (this.project.dev) {
        this.#storySetWatcher?.watch();
        (async () => {
          for await (const event of this.#storySetWatcher ?? []) {
            if (event.type === "FIND") {
              this.#onStoryFind(event.entryPoint);
            }
            if (event.type === "LOSS") {
              this.#onStoryLoss(event.entryPoint);
            }
          }
        })();
      }
      this.#hostProject = new Project({
        plugins: [
          new BuildPlugin({
            entryPoint: "./index.tsx",
            overrideEsbuildOptions: (options) => {
              options.define = {
                ...options.define,
                STORYBOOK_CONSTANTS: this.constants
                  ? JSON.stringify(this.constants)
                  : "undefined",
              };
            },
          }),
          new HtmlTemplatePlugin({ entryPoint: "./index.html" }),
          new BuildPlugin({ entryPoint: "./server.ts", scope: "SERVER" }),
          new RunPlugin({ scope: "SERVER", args: ["-A"] }),
          this.#storyLrHostPlugin,
        ],
        sourceUrl: import.meta.resolve("./"),
        targetUrl: this.project.targetUrl,
        dev: this.project.dev,
        debug: this.project.debug,
      });
      this.#nestProjectLoggers(this.#hostProject, ["UI"]);
      await this.#hostProject.bootstrap();
    });
  }

  async [Symbol.asyncDispose]() {
    await this.#hostProject?.[Symbol.asyncDispose]();
    for (const project of this.#domainProjects.values()) {
      await project[Symbol.asyncDispose]();
    }
  }

  async #onStoryFind(entryPoint: string) {
    const storyMeta = StoryMeta.fromEntryPoint(
      entryPoint,
      this.project.sourceUrl,
    );
    this.logger.debug(`Found story ${storyMeta.entryPoint}`);
    const storyTargetUrl = this.#getStoryTargetUrl(storyMeta);
    const domainProject = new Project({
      plugins: [
        new CleanPlugin(),
        ...(this.getPlugins?.(entryPoint) ?? []),
        new StoryMetaPlugin({ entryPoint }),
        new StoryLrDomainPlugin({
          onUpdate: () => {
            this.#storyLrHostPlugin.reload(storyMeta.id);
          },
        }),
      ],
      sourceUrl: this.project.sourceUrl,
      targetUrl: storyTargetUrl,
      dev: this.project.dev,
      debug: this.project.debug,
    });
    this.#nestProjectLoggers(domainProject, [storyMeta.id]);
    this.#domainProjects.set(entryPoint, domainProject);
    await domainProject.bootstrap();
  }

  async #onStoryLoss(entryPoint: string) {
    const storyMeta = StoryMeta.fromEntryPoint(
      entryPoint,
      this.project.sourceUrl,
    );
    this.logger.debug(`Lost story ${storyMeta.entryPoint}`);
    const storyProject = this.#domainProjects.get(entryPoint);
    if (!storyProject) {
      return;
    }
    await storyProject[Symbol.asyncDispose]();
    const storyTargetUrl = this.#getStoryTargetUrl(storyMeta);
    this.#domainProjects.delete(entryPoint);
    await Deno.remove(path.fromFileUrl(storyTargetUrl), { recursive: true });
    this.#storyLrHostPlugin.reload(storyMeta.id);
  }

  #getStoryTargetUrl(storyMeta: StoryMeta) {
    return new URL(
      `./stories/${storyMeta.id}/`,
      this.project.targetUrl,
    ).toString();
  }

  #nestScopeLogger(
    scopeLogger: this["logger"],
    segments: string[] = [],
  ) {
    scopeLogger.scope = [
      this.logger.scope,
      ...segments,
      scopeLogger.scope,
    ].join(" > ");
  }

  #nestProjectLoggers(project: Project, segments: string[] = []) {
    this.#nestScopeLogger(project.logger, segments);
    project.plugins.forEach((v) => {
      this.#nestScopeLogger(v.logger, segments);
    });
  }
}
