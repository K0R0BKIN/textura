import 'server-only';

// A buffered async queue: producers push while it's being read or before,
// and the reader gets everything in order.
export function channel<T>() {
  const buffer: T[] = [];
  let closed = false;
  let failure: unknown;
  let wake: (() => void) | undefined;
  return {
    push(value: T) {
      buffer.push(value);
      wake?.();
    },
    close(error?: unknown) {
      closed = true;
      failure = error;
      wake?.();
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (buffer.length > 0) {
          yield buffer.shift()!;
          continue;
        }
        if (closed) {
          if (failure) throw failure;
          return;
        }
        await new Promise<void>((resolve) => (wake = resolve));
        wake = undefined;
      }
    },
  };
}
