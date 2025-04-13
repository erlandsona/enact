import reactLogo from "./assets/react.svg";
import effectionLogo from "./assets/effection.svg";
import "./App.css";
import { enact } from "./enact.tsx";
import { StopWatch } from "./examples/Stopwatch.tsx";
import { Counter } from "./examples/Counter.tsx";
import { Search } from "./examples/Search.tsx";
import { $ } from './enact.tsx'

export const App = enact(function* () {
  yield* $(
    <>
      <div>
        <a href="https://frontside.com/effection" target="_blank">
          <img src={effectionLogo} className="logo" alt="Effection logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Effection + React + TypeScript Examples</h1>
      <div className="card">
        <h2>Timer</h2>
        <StopWatch />
      </div>
      <div className="card">
        <h2>Counter</h2>
        <Counter />
      </div>
      <div className="card">
        <h2>Debounce</h2>
        <Search />
      </div>
    </>
  );
});
