import type { MutableRefObject, Ref, RefObject } from "react";
import type { MaybePromise } from "../utils";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export const useIsomorphicLayoutEffect =
  typeof document !== "undefined" ? useLayoutEffect : useEffect;

export function isPromise<T>(value: MaybePromise<T>): value is PromiseLike<T> {
  return value != null && typeof (value as PromiseLike<T>).then === "function";
}

export function useForceUpdate() {
  const [_, forceUpdate] = useState(0);
  return useCallback(() => forceUpdate(n => (n + 1) | 0), []);
}

export function useIsUnmounted(): RefObject<boolean> {
  const isUnmountRef = useRef(false);
  useEffect(() => {
    isUnmountRef.current = false;
    return () => {
      isUnmountRef.current = true;
    };
  }, []);
  return isUnmountRef;
}

/**
 * Leave promise unresolved when the component is unmounted.
 *
 * ```js
 * const sp = useSafePromise()
 * setLoading(true)
 * try {
 *   const result1 = await sp(fetchData1())
 *   const result2 = await sp(fetchData2(result1))
 *   setData(result2)
 * } catch(e) {
 *   setHasError(true)
 * }
 * setLoading(false)
 * ```
 */
export function useSafePromise() {
  const isUnmountRef = useIsUnmounted();

  function safePromise<T, E = unknown>(
    promise: PromiseLike<T>,
    onUnmountedError?: (error: E) => void,
  ) {
    // the async promise executor is intended
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<T>(async (resolve, reject) => {
      try {
        const result = await promise;
        if (!isUnmountRef.current) {
          resolve(result);
        }
        // unresolved promises will be garbage collected.
      } catch (error) {
        if (!isUnmountRef.current) {
          reject(error);
        } else if (onUnmountedError) {
          onUnmountedError(error as E);
        } else {
          if (process.env.NODE_ENV === "development") {
            console.error("An error occurs from a promise after a component is unmounted", error);
          }
        }
      }
    });
  }

  return useCallback(safePromise, [isUnmountRef]);
}

export function applyRef<T>(ref: Ref<T>, value: T) {
  if (typeof ref === "function") {
    ref(value);
  } else if (typeof ref === "object" && ref) {
    (ref as MutableRefObject<T>).current = value;
  }
}

/**
 * Sugar to merge forwarded ref and produce a local ref (state).
 *
 * ```jsx
 * const Button = forwardRef((props, ref) => {
 *   const [div, setDiv] = useForwardRef(ref)
 *   // use 'div' here
 *   return <div ref={setDiv} />
 * })
 * ```
 */
export function useForwardRef<T>(ref: Ref<T>): [T | null, (value: T | null) => void] {
  const [current, setCurrent] = useState<T | null>(null);
  const forwardedRef = useCallback(
    (value: T | null) => {
      setCurrent(value);
      applyRef(ref, value);
    },
    [ref, setCurrent],
  );
  return [current, forwardedRef];
}

/**
 * Await a promise or return the value directly.
 */
export function useAwaited<T>(promise: MaybePromise<T>): T | undefined {
  const sp = useSafePromise();
  const [value, setValue] = useState<T | undefined>();

  useIsomorphicLayoutEffect(() => {
    if (isPromise(promise)) {
      sp(promise).then(setValue);
    } else {
      setValue(promise);
    }
  }, [promise, sp]);

  return value;
}
