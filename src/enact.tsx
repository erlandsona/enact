import {
  call,
  createChannel,
  createContext,
  createScope,
  createSignal,
  each,
  type Operation,
  type Future,
  resource,
  spawn,
  Stream,
} from "effection";
import type { ReactNode } from "react";
import React, { useEffect, useState, useRef } from "react";

export interface EnactComponent<T> {
  // NOTE: Disambiguate between undefined ReactNode's and yielding void.
  (props: T): Operation<ReactNode | void>;
}

export function* render(current?: ReactNode): Operation<void> {
  let setContent = yield* RenderContext.expect();
  setContent(current);
}

export const r = render;

const RenderContext =
  createContext<(_: ReactNode) => void>("enact.render");

export function enact<T>(component: EnactComponent<T>) {
  return (props: T) => {
    const [content, setContent] = useState<ReactNode>();
    // Store ref to Future of previous render to block subsequent renders until
    // cleanup function has run to completion.
    const destroying = useRef<Future<void>>(void 0);

    useEffect(() => {
      const [scope, destroy] = createScope();
      scope.set(RenderContext, setContent);
      scope
        .run(function* () {
          // Block subsequent renders until cleanup function has run to completion.
          if (destroying.current) {
            yield* destroying.current;
          }
          const val = yield* component(props);
          if (React.isValidElement(val)) {
            setContent(val);
          }
        })
        .catch((e) => {
          throw new Error(e);
        });
      return () => {
        destroying.current = destroy();
        destroying.current.catch((e) => {
          console.error("Cleanup failed:", e);
        });
      };
    }, [props]);

    return content;
  };
}

export interface Value<T> extends Computed<T> {
  current: T;
  set(value: T): void;
  is(value: T): Operation<boolean>;
}

export function useValue<T>(initial: T): Value<T> {
  let ref = { current: initial };
  let values = createSignal<T>();

  let set = (value: T) => {
    if (value !== ref.current) {
      ref.current = value;
      values.send(value);
    }
  };

  function is(value: T): Operation<boolean> {
    return call(function* () {
      if (value === ref.current) {
        return true;
      } else {
        for (let next of yield* each(values)) {
          if (next === value) {
            return true;
          }
          yield* each.next();
        }
        return false;
      }
    });
  }

  let computed = compute<T>(function* (emit) {
    yield* emit(ref.current);

    for (let value of yield* each(values)) {
      yield* emit(value);
      yield* each.next();
    }
  });

  return {
    get current() {
      return ref.current;
    },
    is,
    set,
    react: computed.react,
    [Symbol.iterator]: computed[Symbol.iterator],
  };
}

export interface Computed<T> extends Stream<T, never> {
  react: React.FC<Record<string | symbol, never>>;
}

export function compute<T>(
  body: (emit: (value: T) => Operation<void>) => Operation<void>,
): Computed<T> {
  let { send: emit, ...stream } = createChannel<T, never>();
  let computed: Stream<T, never> = resource(function* (provide) {
    let subscription = yield* stream;
    yield* spawn(() => body(emit));

    yield* provide(subscription);
  });

  let react = enact<Record<string, never>>(function* () {
    for (let value of yield* each(computed)) {
      yield* r(String(value));
      yield* each.next();
    }
  });

  return {
    react,
    [Symbol.iterator]: computed[Symbol.iterator],
  };
}

export function map<A, B, C>(
  stream: Stream<A, C>,
  fn: (value: A) => B,
): Stream<B, C> {
  return {
    *[Symbol.iterator]() {
      let source = yield* stream;
      return {
        *next() {
          let next = yield* source.next();
          return next.done ? next : { done: false, value: fn(next.value) };
        },
      };
    },
  };
}
