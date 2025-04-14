import { useAbortSignal, until, type Operation } from "effection";
import { enact, $ } from "../enact.tsx";
import React, { ChangeEventHandler } from "react";

export function Search(props: { query?: string }) {
  const [query, setQuery] = React.useState(props.query);

  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setQuery(event.target.value);
  };

  return (
    <div>
      <input value={query} onChange={onChange} />
      <SearchResults {...{ query }} />
    </div>
  );
}

let results: Results | undefined;

const SearchResults = enact<{ query?: string }>(function* ({ query }) {
  if (!query?.length) {
    yield* $(<p>Enter a keyword to search for packages on NPM.</p>); // Renders an "Initial State"
    results = undefined;
    return; // skip everything else below.
  }
  if (results) {
    yield* $(
      <div className="relative">
        <SearchResultsList {...results} />
        <div className="absolute opacity-50 bg-black top-0 left-0 size-full" />
      </div>,
    );
  } else {
    yield* $(<p>Loading results for {query}...</p>);
  }
  try {
    const stuff = yield* npmSearch(query);
    results = stuff;
    yield* $(<SearchResultsList {...stuff} />);
  } catch (error) {
    yield* $(<ErrorMessage error={error as Error} />);
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
