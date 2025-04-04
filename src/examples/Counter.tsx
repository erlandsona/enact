import { enact, useValue } from "../enact.tsx";

/**
 * ```ts
 * function AppClassic() {
    const [count, setCount] = useState(0);

    return (
      <button type="button" onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    );
  }
  ```
 */
export const Counter = enact(function*() {
    let count = useValue(0);
  
    return (
      <button type="button" onClick={() => count.set(count.current + 1)}>
      count is <count.react />
    </button>
    );
})