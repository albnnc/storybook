import { EffectCallback, useEffect, useRef } from "react";

export function useUpdateEffect(fn: EffectCallback, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    return fn();
  }, deps);
}
