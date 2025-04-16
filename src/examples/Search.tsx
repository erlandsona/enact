import { useAbortSignal, action, until, type Operation } from "effection";
import { enact, r } from "../enact.tsx";
import React, { ChangeEventHandler } from "react";
import { ErrorBoundary } from "react-error-boundary";

export function Search(props: { query?: string }) {
  const [query, setQuery] = React.useState(props.query);

  const [throwOn, setThrowOn] = React.useState<"sync" | "async" | undefined>();

  const isThrower = (s: string): s is "sync" | "async" =>
        ["sync", "async"].includes(s)
  return (
    <div>
      <label>
        Error Behavior{' '}
        <select
          defaultValue={undefined}
          onChange={(e) => {
            const value = e.target.value
            if (isThrower(value)) {
              setThrowOn(value);
            } else {
              setThrowOn(void 0);
            }
          }}
        >
          <option>Happy Path</option>
          <option value="sync">Throw a Synchronous Error</option>
          <option value="async">Throw an Asynchronous Error</option>
        </select>
      </label>
      <br />
      <label>
      Query: {' '}
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      </label>
      <br />
      <ErrorBoundary
        resetKeys={[query]}
        fallbackRender={({ error }) => `Oh no! ${error}`}
      >
        <SearchResults {...{ throwOn, query }} />
      </ErrorBoundary>
    </div>
  );
}

let results: Results | undefined;

const SearchResults = enact<{
  throwOn?: "async" | "sync";
  query?: string;
}>(function* ({ query, throwOn }) {
  if (!query?.length) {
    results = undefined;
    return <p>Enter a keyword to search for packages on NPM.</p>; // Renders an "Initial State"
  }
  if (results) {
    yield* r(
      <div className="relative">
        <SearchResultsList {...results} />
        <div className="absolute opacity-50 bg-black top-0 left-0 size-full" />
      </div>,
    );
  } else {
    yield* r(<p>Loading results for {query}...</p>);
  }
  switch (throwOn) {
    case "async": {
      yield* action((_res, rej) => {
        let to = setTimeout(() => rej(new Error("Ah Dang!")), 1000);
        return () => clearTimeout(to);
      });
      break;
    }
    case "sync": {
      throw new Error("Oh Bummer!");
    }
  }
  try {
    const stuff = yield* npmSearch(query);
    results = stuff;
    return <SearchResultsList {...stuff} />;
  } catch (error) {
    return <ErrorMessage error={error as Error} />;
  }
});

function SearchResultsList({ results }: Results) {
  return results.length === 0 ? (
    <p>No results</p>
  ) : (
    <ul>
      {results.map((result) => (
        <li key={result.package.name}>
          <h3 className="package-name">
            <a href={result.package.links.npm} target="_blank">
              {result.package.name}
            </a>{" "}
            <small className="package-version">
              ({result.package.version})
            </small>
          </h3>
          <p className="package-description">{result.package.description}</p>
        </li>
      ))}
    </ul>
  );
}

type Results = {
  results: Array<{
    package: {
      name: string;
      version: string;
      description: string;
      links: { npm: string };
    };
  }>;
};

function* npmSearch(query: string): Operation<Results> {
  const signal = yield* useAbortSignal();
  /* npms.io search API is used in this example. Good stuff.*/
  const url = `https://api.npms.io/v2/search?from=0&size=25&q=${query}`;
  let response = yield* until(fetch(url, { signal }));

  if (response.ok) {
    return yield* until(response.json());
  }

  /* If API returns some weird stuff and not 2xx, convert it to error and show
     on the screen. */
  throw new Error(yield* until(response.text()));
}

function ErrorMessage({ error }: { error: Error }) {
  return (
    <details>
      <summary>Something went wrong!</summary>
      <p>{error.message}</p>
    </details>
  );
}
