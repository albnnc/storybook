import { isWalkable } from "./is_walkable.ts";
import { set } from "./set.ts";
import { walk } from "./walk.ts";

export function getSchemaDefaults(schema: unknown) {
  const result = {};
  if (isWalkable(schema)) {
    walk(schema, (value, path) => {
      if (value !== undefined && path[path.length - 1] === "default") {
        set(
          result,
          path.slice(0, -1).filter((v) => v !== "properties"),
          value,
        );
      }
    });
  }
  // deno-lint-ignore no-explicit-any
  return result as any;
}
