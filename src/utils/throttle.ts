export interface ThrottledFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Creates a throttled function that only invokes `fn` at most once per every `wait` milliseconds.
 * Always guarantees that the final value passed is dispatched on release (trailing call).
 *
 * @param fn The function to throttle (e.g. MQTT slider or color command)
 * @param wait Throttle interval in milliseconds (default 150 ms)
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  wait = 150
): ThrottledFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const invoke = (args: Parameters<T>) => {
    lastCallTime = Date.now();
    timeoutId = null;
    lastArgs = null;
    fn(...args);
  };

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invoke(args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          invoke(lastArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = 0;
  };

  throttled.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      invoke(lastArgs);
    }
  };

  return throttled;
}
