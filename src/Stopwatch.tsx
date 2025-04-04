import { $, enact, map, useValue } from "./enact.tsx";
import { interval } from "./interval.ts";
import { each, Operation, race, spawn } from "effection";

/**
 * ```ts
 * export function StopwatchClassic() {
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
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
      </>
    );
  }
 * ```
 */
export const StopWatch = enact(function* () {
  let running = useValue(false);
  let elapsed = useValue<string>("0.000");

  yield* spawn(function* () {
    while (true) {
      // wait until timer is marked running.
      yield* running.is(true);

      //capture the start time.
      let startTime = Date.now();

      function* runWatch(): Operation<void> {
        for (let now of yield* each(map(interval(10), () => Date.now()))) {
          let seconds = (now - startTime) / 1000;
          elapsed.set(seconds.toFixed(3));
          yield* each.next();
        }
      }

      // emit time diff until running becomes false.
      yield* race([running.is(false), runWatch()]);

      // now running is false, so we go back to the top of the loop
    }
  });

  for (let isRunning of yield* each(running)) {
    yield* $(
      <>
        <h3>
          Time passed: <elapsed.react />{" "}
        </h3>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => running.set(true)}
        >
          Start
        </button>
        <button
          type="button"
          disabled={!isRunning}
          onClick={() => running.set(false)}
        >
          Stop
        </button>
      </>,
    );
    yield* each.next();
  }
});
