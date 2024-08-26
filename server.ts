import * as fs from "@std/fs";
import * as fileServer from "@std/http/file-server";
import * as path from "@std/path";

const currentDir = path.fromFileUrl(import.meta.resolve("./"));
const metaGlob = path.join(currentDir, "./stories/*/meta.json");
const indexHtmlFilePath = path.join(currentDir, "./index.html");
const urlRoot = Deno.env.get("URL_ROOT") || undefined;

Deno.serve({
  handler: async (req) => {
    const url = new URL(req.url);
    const pathname = urlRoot
      ? url.pathname.replace(urlRoot, "").replace(/\/+/, "/")
      : url.pathname;
    if (pathname === "/api/stories") {
      const metas: unknown[] = [];
      for await (const v of fs.expandGlob(metaGlob)) {
        metas.push(await Deno.readTextFile(v.path).then(JSON.parse));
      }
      return new Response(JSON.stringify(metas));
    }
    return (
      fileServer
        .serveDir(req, {
          fsRoot: currentDir,
          urlRoot,
          quiet: true,
        })
        .then((v) =>
          v.status === 404 ? fileServer.serveFile(req, indexHtmlFilePath) : v
        )
    );
  },
});
