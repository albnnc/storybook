import * as async from "@std/async";
import * as fs from "@std/fs";
import * as path from "@std/path";

export interface StorySetWatcherEvent {
  type: "FIND" | "LOSS";
  entryPoint: string;
}

export interface StorySetOptions {
  sourceUrl: string;
  globUrl: string;
}

export class StorySetWatcher
  implements Disposable, AsyncIterable<StorySetWatcherEvent> {
  data = new Set<string>();

  #sourceUrl: string;
  #globUrl: string;
  #fsWatcher?: Deno.FsWatcher;
  #queuePwr = Promise.withResolvers<StorySetWatcherEvent[]>();

  constructor({ sourceUrl, globUrl }: StorySetOptions) {
    this.#sourceUrl = sourceUrl;
    this.#globUrl = globUrl;
  }

  async watch() {
    this.#fsWatcher = Deno.watchFs(path.fromFileUrl(this.#sourceUrl));
    const debounced = async.debounce(() => this.walk(), 200);
    for await (const _ of this.#fsWatcher) {
      debounced();
    }
  }

  async walk() {
    const nextQueue: StorySetWatcherEvent[] = [];
    const nextData = new Set<string>();
    const globPath = path.fromFileUrl(new URL(this.#globUrl, this.#sourceUrl));
    for await (const v of fs.expandGlob(globPath, { globstar: true })) {
      v.isFile && nextData.add(path.toFileUrl(v.path).toString());
    }
    for (const v of nextData.values()) {
      if (!this.data.has(v)) {
        nextQueue.push({ type: "FIND", entryPoint: v });
        this.data.add(v);
      }
    }
    for (const v of this.data.values()) {
      if (!nextData.has(v)) {
        nextQueue.push({ type: "LOSS", entryPoint: v });
        this.data.delete(v);
      }
    }
    if (nextQueue.length) {
      this.#queuePwr.resolve(nextQueue);
    }
  }

  async *[Symbol.asyncIterator]() {
    if (!this.#fsWatcher) {
      throw new Error("Not watching");
    }
    while (true) {
      const queue = await this.#queuePwr.promise;
      if (!queue.length) {
        return;
      }
      for (const v of queue) {
        yield v;
      }
      this.#queuePwr = Promise.withResolvers();
    }
  }

  [Symbol.dispose]() {
    this.#fsWatcher?.[Symbol.dispose]();
    this.#queuePwr.resolve([]);
  }
}
