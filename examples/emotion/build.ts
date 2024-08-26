#!/usr/bin/env -S deno run -A
import {
  BuildPlugin,
  CleanPlugin,
  DevServerPlugin,
  HtmlTemplatePlugin,
  LiveReloadPlugin,
  Project,
} from "@albnnc/nvil";
import { StorybookPlugin } from "@albnnc/storybook";

await using project = new Project({
  plugins: [
    new StorybookPlugin({
      globUrl: "./**/*_story.tsx",
      getPlugins: () => [
        new CleanPlugin(),
        new BuildPlugin({ entryPoint: "./index.tsx" }),
        new HtmlTemplatePlugin({ entryPoint: "./index.html" }),
        new LiveReloadPlugin(),
        new DevServerPlugin(),
      ],
    }),
  ],
  sourceUrl: import.meta.resolve("./"),
  targetUrl: "./.target/",
  dev: Deno.args[0] === "dev",
});

await project.bootstrap();
await project.done();
