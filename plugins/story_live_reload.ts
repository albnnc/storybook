import { Plugin, type PluginApplyOptions } from "@albnnc/nvil";
import * as async from "@std/async";
import { getAvailablePort } from "@std/net";

export class StoryLiveReloadPlugin extends Plugin {
  port = getAvailablePort({ preferredPort: 43001 });
  callbacks = new Map<string, (id: string) => void>();

  constructor() {
    super("STORY_LIVE_RELOAD");
  }

  apply(this: StoryLiveReloadPlugin, options: PluginApplyOptions) {
    super.apply(options);
    if (!this.project.dev) {
      return;
    }
    this.serve();
    const handleChange = async.debounce(async (change: string) => {
      const entry = this.project.bundle.get(change);
      if (!entry || entry.scope !== undefined) {
        return;
      }
      const storyBaseUrl = new URL(
        "./",
        new URL(change, this.project.targetUrl),
      );
      const storyMetaUrl = new URL("./meta.json", storyBaseUrl);
      console.log("storyMetaUrl", storyMetaUrl);
      const id = await fetch(storyMetaUrl)
        .then((v) => v.json())
        .then((v) => v.id)
        .catch(() => undefined);
      if (!id) {
        return;
      }
      this.logger.info(`Reloading`);
      await fetch(new URL(`http://localhost:${this.port}`), {
        method: "POST",
        body: id,
      })
        .then(async (v) => {
          await v.body?.cancel();
          if (!v.ok) {
            this.logger.warn("Unable to request reload");
          }
        })
        .catch(() => undefined);
    }, 200);
    this.project.stager.on("WRITE_END", (changes) => {
      for (const change of changes as string[]) {
        handleChange(change);
      }
    });
  }

  // TODO: Implement disposal.
  private serve() {
    Deno.serve({
      port: this.port,
      onListen: ({ hostname, port }) => {
        this.logger.info(`Listening events on ${hostname}:${port}`);
      },
    }, (request) => {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
      if (request.method === "GET") {
        const { callbacks } = this;
        const callbackId = crypto.randomUUID();
        const body = new ReadableStream({
          start(controller) {
            callbacks.set(callbackId, (id) => {
              controller.enqueue(`data: ${id}\n\n`);
            });
          },
          cancel() {
            callbacks.delete(callbackId);
          },
        });
        return new Response(body.pipeThrough(new TextEncoderStream()), {
          headers: {
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
      if (request.method === "POST") {
        request.text().then((v) => this.reload(v));
        return new Response(null, {
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
      return new Response(null, {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    });
  }

  private reload(id: string) {
    this.logger.info("Reloading");
    this.callbacks.forEach((fn) => fn(id));
  }
}
