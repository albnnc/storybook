#!/usr/bin/env -S deno run -A
import { BuildPlugin, HtmlTemplatePlugin, Project } from "@albnnc/nvil";
import { StorybookPlugin } from "@albnnc/storybook";

await using project = new Project({
  plugins: [
    new StorybookPlugin({
      globUrl: "./stories/*.tsx",
      getPlugins: (entryPoint) => [
        new BuildPlugin({ entryPoint }),
        new HtmlTemplatePlugin({ entryPoint: "./index.html" }),
      ],
    }),
  ],
  sourceUrl: import.meta.resolve("./"),
  targetUrl: "./.target/",
  dev: Deno.args.includes("--dev"),
  debug: Deno.args.includes("--debug"),
});

await project.bootstrap();
await project.done();
