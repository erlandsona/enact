import { useRef, useState } from "react";
import { $, compute, enact, map, useValue } from "./enact.tsx";
import { interval } from "./interval.ts";
import { each, Operation, race } from "effection";

export function StopwatchClassic() {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);

  function handleStart() {
    setStartTime(Date.now());
    setNow(Date.now());

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 10);
  }

  function handleStop() {
    clearInterval(intervalRef.current);
  }

  let secondsPassed = 0;
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000;
  }

  return (
    <>
      <h1>Time passed: {secondsPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>
        Start
      </button>
      <button onClick={handleStop}>
        Stop
      </button>
    </>
  );
}

export const StopWatch = enact(function* () {
  let running = useValue(false);
  let startTime = 0;

  let elapsed = compute<string>(function* (emit) {
    while (true) {
      // wait until timer is marked running.
      yield* running.is(true);

      //capture the start time if it isn't started already.
      if (!startTime) {
        startTime = Date.now();
      }

      function* runWatch(): Operation<void> {
        for (let now of yield* each(map(interval(10), () => Date.now()))) {
          let seconds = (now - startTime) / 1000;
          yield* emit(seconds.toFixed(3));
          yield* each.next();
        }
      }

      // emit time diff until running becomes false.
      yield* race([running.is(false), runWatch()]);

      // now running is false, so we go back to the top of the loop
    }
  });

  return (
    <>
      <h1>
        Time passed: <elapsed.react />
      </h1>
      <button type="button" onClick={() => running.set(true)}>
        Start
      </button>
      <button type="button" onClick={() => running.set(false)}>
        Stop
      </button>
    </>
  );
});
