import { Plugin, type PluginApplyOptions } from "@albnnc/nvil";
import { debounce } from "@std/async";
import { getAvailablePort } from "@std/net";

export class StoryLrHostPlugin extends Plugin {
  #port = getAvailablePort({ preferredPort: 43000 });
  #callbacks = new Map<string, (id: string) => void>();

  get #liveReloadScript() {
    return `
      new EventSource("http://localhost:${this.#port}")
        .addEventListener("message", (event) => {
          dispatchEvent(
            new CustomEvent("story-update", { detail: event.data })
          );
        });
    `
      .trim()
      .replace(/\s+/g, " ");
  }

  constructor() {
    super("STORY_LR_HOST");
  }

  apply(this: StoryLrHostPlugin, options: PluginApplyOptions) {
    super.apply(options);
    if (!this.project.dev) {
      return;
    }
    this.#serve();
    const scriptUrl = "./live-reload.js";
    this.project.stager.on("BOOTSTRAP", async () => {
      this.logger.debug(`Populating ${scriptUrl}`);
      const encoder = new TextEncoder();
      const data = encoder.encode(this.#liveReloadScript);
      this.project.bundle.set(scriptUrl, { data, scope: "STORY_LR_HOST" });
      await this.project.stager.run("LIVE_RELOAD_SCRIPT_POPULATE");
    });
  }

  reload = debounce((id: string) => {
    this.logger.debug(`Reloading story ${id}`);
    this.#callbacks.forEach((fn) => fn(id));
  }, 200);

  #serve() {
    Deno.serve({
      signal: this.disposalSignal,
      port: this.#port,
      onListen: ({ hostname, port }) => {
        this.logger.debug(`Listening events on ${hostname}:${port}`);
      },
    }, (request) => {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
      if (request.method === "GET") {
        const callbacks = this.#callbacks;
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
}
