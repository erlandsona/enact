import type { Stream } from "effection";
import { resource, createSignal } from "effection";

export function interval<TArgs extends unknown[]>(
  periodMS: number,
  ...args: TArgs
): Stream<TArgs, never> {
  return resource(function* (provide) {
    let values = createSignal<TArgs>();
    let intervalId = setInterval(() => values.send(args), periodMS);
    try {
      yield* provide(yield* values);
    } finally {
      clearInterval(intervalId);
    }
  });
}
